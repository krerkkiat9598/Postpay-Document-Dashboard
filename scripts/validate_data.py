import json
import sys

EXPECTED_STATUS = {
    "สมบูรณ์",
    "ไม่สมบูรณ์",
    "ไม่สมบูรณ์ (X Flag)"
}

REQUIRED_KEYS = {
    "m",
    "rr",
    "ar",
    "ch",
    "ot",
    "sh",
    "emp",
    "st",
    "cat",
    "reason"
}


def main(path):
    text = open(path, encoding="utf-8").read().strip()

    prefix = "window.POSTPAY_DATA = "
    suffix = ";"

    if not text.startswith(prefix):
        raise ValueError(
            "data.js does not start with window.POSTPAY_DATA"
        )

    payload = text[len(prefix):]

    if payload.endswith(suffix):
        payload = payload[:-1]

    data = json.loads(payload)

    if not isinstance(data, list):
        raise ValueError(
            "POSTPAY_DATA must be a list"
        )

    if len(data) == 0:
        raise ValueError(
            "POSTPAY_DATA contains 0 rows"
        )

    for i, row in enumerate(data, start=1):
        missing = REQUIRED_KEYS - set(row.keys())

        if missing:
            raise ValueError(
                f"Row {i}: missing keys {sorted(missing)}"
            )

        if row["st"] not in EXPECTED_STATUS:
            raise ValueError(
                f"Row {i}: unexpected status "
                f"{row['st']!r}"
            )

    status_counts = {}

    for row in data:
        status = row["st"]
        status_counts[status] = (
            status_counts.get(status, 0) + 1
        )

    print("VALIDATION PASSED")
    print(f"Rows: {len(data):,}")

    for status, count in sorted(
        status_counts.items()
    ):
        print(
            f"{status}: {count:,}"
        )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            "Usage: python validate_data.py data.js"
        )
        sys.exit(1)

    main(sys.argv[1])
