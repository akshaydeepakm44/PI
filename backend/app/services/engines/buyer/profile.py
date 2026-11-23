from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import datetime
from app.services.engines.assumptions import get_assumption

VALID_PRIORITIES = [
    "commute time",
    "green space",
    "price per usable foot",
    "possession date",
    "noise and air",
    "amenities"
]

@dataclass
class DestinationPlace:
    name: str
    destination_type: str = "office" # office, school, college, other
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    trips_per_day: Optional[int] = None
    days_per_year: Optional[int] = None
    is_assumed: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "destination_type": self.destination_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "trips_per_day": self.trips_per_day,
            "days_per_year": self.days_per_year,
            "is_assumed": self.is_assumed
        }

@dataclass
class HouseholdInfo:
    adults: int = 2
    children: int = 0
    school_going: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "adults": self.adults,
            "children": self.children,
            "school_going": self.school_going
        }

@dataclass
class BuyerProfile:
    household: HouseholdInfo = field(default_factory=HouseholdInfo)
    places: List[DestinationPlace] = field(default_factory=list)
    priorities: List[str] = field(default_factory=list)
    vehicles: int = 1
    budget_band: Optional[str] = None
    planned_move_date: Optional[str] = None

    def __post_init__(self):
        # Cap places at 5
        if len(self.places) > 5:
            self.places = self.places[:5]
        # Cap priorities at 3, valid only
        self.priorities = [p for p in self.priorities if p in VALID_PRIORITIES][:3]

        # Resolve assumed trips & days for places
        for pl in self.places:
            dest_lower = (pl.destination_type or "office").lower()
            if pl.trips_per_day is None:
                if dest_lower == "school" or self.household.school_going:
                    t_assump = get_assumption("trips_per_school_day")
                    pl.trips_per_day = t_assump.value if t_assump else 4
                else:
                    t_assump = get_assumption("trips_per_work_day")
                    pl.trips_per_day = t_assump.value if t_assump else 2
                pl.is_assumed = True
            if pl.days_per_year is None:
                if dest_lower == "school":
                    d_assump = get_assumption("school_days_per_year")
                    pl.days_per_year = d_assump.value if d_assump else 200
                else:
                    d_assump = get_assumption("working_days_per_year")
                    pl.days_per_year = d_assump.value if d_assump else 250
                pl.is_assumed = True

    def matches_priority(self, topic: str) -> bool:
        """Checks if a finding topic matches any of user's chosen priorities."""
        topic_lower = topic.lower()
        for p in self.priorities:
            if p in topic_lower:
                return True
            if p == "commute time" and any(k in topic_lower for k in ["commute", "travel", "distance", "drive", "walk"]):
                return True
            if p == "green space" and any(k in topic_lower for k in ["green", "park", "open space", "shade", "garden"]):
                return True
            if p == "price per usable foot" and any(k in topic_lower for k in ["price", "carpet", "rate", "efficiency", "usable foot"]):
                return True
            if p == "possession date" and any(k in topic_lower for k in ["possession", "completion", "delay", "handover", "rera"]):
                return True
            if p == "noise and air" and any(k in topic_lower for k in ["air", "aqi", "pm2.5", "noise", "railway", "road", "sound"]):
                return True
            if p == "amenities" and any(k in topic_lower for k in ["amenity", "clubhouse", "pool", "sports", "gym"]):
                return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "household": self.household.to_dict(),
            "places": [p.to_dict() for p in self.places],
            "priorities": self.priorities,
            "vehicles": self.vehicles,
            "budget_band": self.budget_band,
            "planned_move_date": self.planned_move_date,
            "family": "buyer",
            "source": "user-profile",
            "date": datetime.date.today().isoformat(),
            "confidence": 1.0
        }

def parse_buyer_profile(data: Optional[Dict[str, Any]]) -> Optional[BuyerProfile]:
    if not data:
        return None
    hh_data = data.get("household") or {}
    household = HouseholdInfo(
        adults=hh_data.get("adults", 2),
        children=hh_data.get("children", 0),
        school_going=hh_data.get("school_going", False)
    )
    places_data = data.get("places") or []
    places = []
    for p in places_data[:5]:
        if isinstance(p, dict) and p.get("name"):
            places.append(DestinationPlace(
                name=p["name"],
                destination_type=p.get("destination_type", "office"),
                latitude=p.get("latitude"),
                longitude=p.get("longitude"),
                trips_per_day=p.get("trips_per_day"),
                days_per_year=p.get("days_per_year"),
                is_assumed=p.get("is_assumed", True)
            ))
    priorities = data.get("priorities") or []
    return BuyerProfile(
        household=household,
        places=places,
        priorities=priorities,
        vehicles=data.get("vehicles", 1),
        budget_band=data.get("budget_band"),
        planned_move_date=data.get("planned_move_date")
    )
