import config
    
def is_good(block):
    """Ensure the block is valid"""
    if len(block) != config.EXPECTED_HEIGHT:
        return False
    for line in block:
        if len(line) != config.EXPECTED_WIDTH:
            return False
        if any(len(c) != 1 or c not in config.ALLOWED_CHARS for c in line):
            return False
    return True

def get_difference(one, two):
    """Compute the differences between two blocks."""
    if len(one) != len(two):
        raise StandardError("blocks are of different dimensions")
    
    diffs = []
    for y in range(len(one)):
        line1 = one[y]
        line2 = two[y]
        if len(line1) != len(line2):
            raise StandardError("blocks are of different dimensions")
        
        for x in range(len(line1)):
            c1 = line1[x]
            c2 = line2[x]
            
            if c1 != c2:
                diffs.append((x, y, c2))
    return diffs

def apply_changes(block, changes):
    """Apply a set of changes to a block."""
    for (x, y, c) in changes:
        block[y][x] = c
    return block
        
def merge_to_string(block):
    """Convert a block back into a string."""
    return '\n'.join(''.join(line) for line in block)
