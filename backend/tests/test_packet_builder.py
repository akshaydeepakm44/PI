import json
import pytest
from app.services.packet_builder import build_calculation_packet, filter_by_allow_list

@pytest.fixture
def mock_property_with_private_and_unknown_fields():
    return {
        "id": 1,
        "name": "Ramky Kingston Park Orbit",
        "ownership_type": "Freehold Private Trust",
        "owner_name": "Secret Landlord Corp",
        "owner_x": "Unknown Owner Variant",
        "seller_name": "Ramky Estates & Projects Ltd",
        "seller_contact": "+91 40 2331 0110 / sales@ramkyestates.com",
        "seller_phone": "+91 9988776655",
        "seller_y": "Unknown Seller Variant",
        "pan_number": "AAACR1234F",
        "pan_z": "Secret PAN 999",
        "aadhaar_number": "1234-5678-9012",
        "bank_details": "HDFC0001234 A/C 999888777",
        "random_unknown_field_123": "Should Be Excluded",
        "unit_count": 1406,
        "site_acres": 16.5,
        "declared_units_per_floor": 10,
        "modules_data": {
            "pricing_breakdown": {
                "base_rate": 8600,
                "floor_rise": 25,
                "start_floor": 4,
                "parking_charges": 300000,
                "corpus_fund": 195000,
                "maintenance_deposit": 94000
            },
            "configurations": [
                {"name": "2 BHK", "sbu_sqft": 1300, "carpet_sqft": 897, "price": 11200000},
                {"name": "3 BHK", "sbu_sqft": 1880, "carpet_sqft": 1297, "price": 16200000}
            ],
            "towers": [
                {"name": "Tower A", "floors": 24, "units_count": 235, "passenger_lifts": 3},
                {"name": "Tower B", "floors": 22, "units_count": 235, "passenger_lifts": 3},
                {"name": "Tower C", "floors": 20, "units_count": 234, "passenger_lifts": 3},
                {"name": "Tower D", "floors": 24, "units_count": 234, "passenger_lifts": 3},
                {"name": "Tower E", "floors": 22, "units_count": 234, "passenger_lifts": 3},
                {"name": "Tower F", "floors": 20, "units_count": 234, "passenger_lifts": 3}
            ],
            "commute_hubs": [
                {"name": "Office Hub", "distance_km": 2.8, "duration_mins": 12},
                {"name": "School", "distance_km": 3.4, "duration_mins": 15}
            ]
        }
    }


def test_packet_builder_allow_list_drops_unknown_fields(mock_property_with_private_and_unknown_fields):
    """
    Asserts that an allow-list strictly filters out unknown or suspicious fields:
    owner_x, seller_y, pan_z, random_unknown_field_123 must NOT enter the packet.
    """
    for module in ["pricing", "master_plan", "commute", "sustainability"]:
        packet = build_calculation_packet(mock_property_with_private_and_unknown_fields, module=module)
        assert packet["private_fields_removed"] is True

        serialised = json.dumps(packet)
        # Check none of the private or unknown fields appear anywhere in serialised JSON
        assert "Secret Landlord Corp" not in serialised
        assert "Freehold Private Trust" not in serialised
        assert "Unknown Owner Variant" not in serialised
        assert "Ramky Estates & Projects Ltd" not in serialised
        assert "+91 40 2331 0110" not in serialised
        assert "+91 9988776655" not in serialised
        assert "Unknown Seller Variant" not in serialised
        assert "AAACR1234F" not in serialised
        assert "Secret PAN 999" not in serialised
        assert "1234-5678-9012" not in serialised
        assert "HDFC0001234" not in serialised
        assert "Should Be Excluded" not in serialised


def test_packet_builder_compactness(mock_property_with_private_and_unknown_fields):
    """
    Packet must contain results, assumptions, data_gaps only, not raw property data.
    """
    packet = build_calculation_packet(mock_property_with_private_and_unknown_fields, module="pricing")
    assert set(packet.keys()) == {"property_id", "module", "private_fields_removed", "results", "assumptions", "data_gaps"}
    assert "modules_data" not in packet
    assert "towers" not in packet
    assert "configurations" not in packet


def test_packet_builder_data_gaps():
    """
    Build data_gaps from missing inputs, naming the field the seller needs to supply.
    """
    sparse_property = {
        "id": 99,
        "name": "Sparse Project",
        "modules_data": {}
    }
    packet = build_calculation_packet(sparse_property, module="commute")
    assert len(packet["data_gaps"]) >= 1
    gap_fields = [g["field"] for g in packet["data_gaps"]]
    assert "commute_hubs" in gap_fields
    assert "seller needs to supply" in packet["data_gaps"][0]["description"].lower()


def test_packet_builder_assumptions_inclusion(mock_property_with_private_and_unknown_fields):
    """
    Assumptions used by engines must be captured in the packet assumptions dict.
    """
    packet = build_calculation_packet(mock_property_with_private_and_unknown_fields, module="master_plan")
    assert "cars_per_home" in packet["assumptions"]
    assert "sqm_per_parking_slot" in packet["assumptions"]
    assert packet["assumptions"]["cars_per_home"]["value"] == 1.0
