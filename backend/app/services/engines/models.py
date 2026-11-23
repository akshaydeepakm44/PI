from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

@dataclass
class CalcResult:
    """
    Standard result structure for all deterministic engine calculations.
    Every function is pure Python and returns this structure.
    """
    id: str
    value: Any
    unit: Optional[str] = None
    formula_text: str = ""
    inputs: Dict[str, Any] = field(default_factory=dict)
    assumptions: List[str] = field(default_factory=list)
    missing_inputs: List[str] = field(default_factory=list)
    status: str = "ok"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "value": self.value,
            "unit": self.unit,
            "formula_text": self.formula_text,
            "inputs": self.inputs,
            "assumptions": self.assumptions,
            "missing_inputs": self.missing_inputs,
            "status": self.status,
        }
