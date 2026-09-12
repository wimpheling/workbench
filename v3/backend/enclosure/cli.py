"""Headless evaluation and supplier export entry point."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .core import build_model, build_shapes
from .exports import export_file
from .verification import verify


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate an enclosure and produce traceable supplier specifications"
    )
    parser.add_argument("--parameters", type=Path, help="JSON file of parameter overrides")
    parser.add_argument("--out", type=Path, default=Path("artifacts"))
    parser.add_argument(
        "--format", choices=["pack", "pdf", "csv", "dxf", "step", "json"], default="pack"
    )
    parser.add_argument(
        "--require-order-ready",
        action="store_true",
        help="Exit 2 if evidence does not support placing orders",
    )
    args = parser.parse_args()
    parameters = json.loads(args.parameters.read_text()) if args.parameters else None
    model = build_model(parameters)
    shapes = build_shapes(model)
    report = verify(model, shapes)
    data, _, name = export_file(args.format, model, report, shapes)
    args.out.mkdir(parents=True, exist_ok=True)
    destination = args.out / name
    destination.write_bytes(data)
    print(
        json.dumps(
            {
                "file": str(destination),
                "revision": model["revision"],
                "status": report["status"],
                "summary": report["summary"],
                "order_ready": report["order_ready"],
            },
            indent=2,
        )
    )
    if args.require_order_ready and not report["order_ready"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
