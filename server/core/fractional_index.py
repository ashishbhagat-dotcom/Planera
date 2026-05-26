"""
Fractional indexing for ordering items without rewriting O(n) rows.

Characters used: 0-9, a-z (base 36, digits before letters so '0' < 'a').
A position is a non-empty string of these characters with no trailing zeros
(except the string "0" itself is not a valid position — we start at "a0").

Public API
----------
generate_position_between(before, after) -> str
    Return a string strictly between `before` and `after`.
    Pass None for before to insert at the head; None for after to insert at tail.

generate_start_position() -> str
    Position to use for the very first item (or to prepend before everything).

generate_end_position() -> str
    Position to use when appending after all existing items.
"""

_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz"
_BASE = len(_DIGITS)  # 36
_ORD = {c: i for i, c in enumerate(_DIGITS)}

# Sentinel boundaries — these are never stored; they bracket all real positions.
_MIN = ""   # conceptually -∞
_MAX = "~"  # conceptually +∞  (ord('~') > ord('z') so always > any position)


def _to_int(s: str) -> int:
    """Convert a base-36 position string to an integer."""
    result = 0
    for ch in s:
        result = result * _BASE + _ORD[ch]
    return result


def _from_int(n: int, min_len: int = 1) -> str:
    """Convert a non-negative integer to a base-36 string, zero-padded to min_len."""
    if n == 0:
        return _DIGITS[0] * max(min_len, 1)
    chars = []
    while n:
        chars.append(_DIGITS[n % _BASE])
        n //= _BASE
    result = "".join(reversed(chars))
    if len(result) < min_len:
        result = _DIGITS[0] * (min_len - len(result)) + result
    return result


def generate_position_between(before: str | None, after: str | None) -> str:
    """
    Generate a position string strictly between `before` and `after`.

    Examples
    --------
    generate_position_between(None, None)   -> "n"  (midpoint of base-36 space)
    generate_position_between("a0", "a2")  -> "a1"
    generate_position_between("a0", "a1")  -> "a0n" (subdivision)
    generate_position_between(None, "a0")  -> something < "a0"
    generate_position_between("z9", None)  -> something > "z9"
    """
    b = before if before is not None else _MIN
    a = after if after is not None else _MAX

    if b >= a and a != _MAX:
        raise ValueError(f"before ({b!r}) must be less than after ({a!r})")

    # Pad shorter string with '0' on the right to make lengths equal for arithmetic
    max_len = max(len(b), len(a)) if a != _MAX else len(b) + 1
    b_padded = b.ljust(max_len, _DIGITS[0])
    a_padded = (a if a != _MAX else "").ljust(max_len, _DIGITS[-1])  # pad `after` with 'z'

    b_int = _to_int(b_padded) if b_padded else 0
    a_int = _to_int(a_padded) if a_padded else _BASE ** max_len

    mid = (b_int + a_int) // 2

    if mid == b_int:
        # No room at this length — go one digit deeper
        return b + _DIGITS[_BASE // 2]

    result = _from_int(mid, min_len=max_len)
    # Strip trailing zeros (canonical form), but keep at least 1 char
    result = result.rstrip(_DIGITS[0]) or _DIGITS[0]
    return result


def generate_start_position() -> str:
    """Position to use when inserting before all existing items."""
    return generate_position_between(None, None)


def generate_end_position(last: str | None = None) -> str:
    """
    Position to use when appending after `last`.
    If last is None, returns the default starting position.
    """
    if last is None:
        return generate_position_between(None, None)
    return generate_position_between(last, None)
