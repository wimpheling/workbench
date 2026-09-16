"""Frame section selection and explicit, conditional beam-only load screens."""

CATALOGUE = "https://reiman.pt/pub/media/catalogue_pdfs/Wolweiss/Wolweiss.pdf"


def point_deflection(force_n, span_mm, inertia_mm4, modulus_mpa=69000):
    """Simply supported beam with a centre point load; mm, N, N/mm²."""
    return force_n * span_mm**3 / (48 * modulus_mpa * inertia_mm4)


def add_header_assessment(model):
    p = model["parameters"]
    span = p["width_mm"]
    cases = []
    for code, inertia, mass in (("AST03003004", 29000, 0.9), ("AST03006006", 199000, 1.6)):
        line_load = mass * 9.81 / 1000
        cases.append(
            dict(
                product_code=code,
                vertical_inertia_mm4=inertia,
                centre_100n_deflection_mm=point_deflection(100, span, inertia),
                self_weight_deflection_mm=5 * line_load * span**4 / (384 * 69000 * inertia),
            )
        )
    # Opening width ends at the jamb edge; the modeled bearing datum is
    # 15 mm farther back at its centre. End support uses the rail end plane.
    guide_spans = [p["depth_mm"] / 2 + 15, p["back_opening_width_mm"] + 15]
    model["header_layout"] = dict(
        front_opening_height_mm=p["height_mm"] - 30,
        front_section_mm=[30, 60],
        side_rear_section_mm=[30, 30],
        guide_adapter_thickness_mm=8,
        source=CATALOGUE,
        source_checked="2026-09-16",
        front_beam_screen=dict(span_mm=span, assumed_modulus_mpa=69000, cases=cases),
        guide_beam_screen=[
            dict(span_mm=L, centre_100n_deflection_mm=point_deflection(100, L, 29000))
            for L in guide_spans
        ],
        status="Conditional beam-only screen; actual loads, joint rotation, torsion, adapter stiffness and fastening require validation. The prior 0.5 mm total guide movement target is not demonstrated by the narrower section.",
    )
    model["assumptions"].append(
        dict(
            id="frame-header-loads",
            confirmed=False,
            description="Upright 3060 front beam and 3030 guide headers: 100 N is an illustrative centre load, not an approved design load. Validate roof loads, guide forces throughout travel, end connections, adapter M4 threads, M5 slot fixings and hood spacers. Guide movement target remains unproven.",
            references=["rail-front-top", "rail-left-top", "rail-back-top"],
        )
    )
    model["ordering"]["unresolved"].append(model["header_layout"]["status"])
