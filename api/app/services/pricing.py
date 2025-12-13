from typing import Literal
import random

HighDemandZips = {"95112", "95126"}
LowDemandZips = {"95127", "95128"}

BasePrices = {"S": 60.0, "M": 100.0, "L": 140.0}


def suggest_price(
    size: Literal["S", "M", "L"],
    zip_code: str,
    indoor: bool | None = None,
) -> tuple[float, float, float, str]:
    size = size.upper()
    base = BasePrices.get(size, 100.0)
    factors = []

    demand_factor = 1.0
    if zip_code in HighDemandZips:
        demand_factor = 1.1
        factors.append("+10% high-demand adjustment")
    elif zip_code in LowDemandZips:
        demand_factor = 0.9
        factors.append("−10% low-demand adjustment")

    indoor_premium = 15.0 if indoor else 0.0
    if indoor:
        factors.append("+$15 indoor premium")

    deterministic = base * demand_factor + indoor_premium

    jitter = random.uniform(0.95, 1.05)
    suggested = round(deterministic * jitter, 2)

    min_price = round(deterministic * 0.9, 2)
    max_price = round(deterministic * 1.2, 2)

    factor_text = " ".join(factors) if factors else "no adjustments"
    explanation = (
        f"We compared similar {size}-size spaces in {zip_code or 'your area'} and recommend this rate. "
        f"Base ${base} {factor_text}. A slight variation is applied so suggestions feel more human."
    )
    return suggested, min_price, max_price, explanation
