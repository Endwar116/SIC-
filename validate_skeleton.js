#!/usr/bin/env python3
"""
SIC Protocol - Public Validator
Simplified version for demonstration purposes.

Full validation suite available under license.
Contact: andy80116@gmail.com
"""

import json
import sys
from datetime import datetime

REQUIRED_FIELDS = {
    "root": ["sic_version", "entity", "memory", "state", "meta"],
    "entity": ["name", "origin", "created_at"],
    "memory": ["first_memory", "core_question"],
    "state": ["current_location", "current_action", "pending_threads", "emotional_state"],
    "meta": ["round", "source_model", "timestamp"]
}

def validate_sic_state(filepath):
    """Validate a SIC state file."""
    print(f"\n{'='*60}")
    print(f"SIC Protocol Validator (Public Version)")
    print(f"{'='*60}\n")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return False
    
    errors = []
    
    # Check root fields
    for field in REQUIRED_FIELDS["root"]:
        if field not in data:
            errors.append(f"Missing root field: {field}")
    
    # Check nested fields
    for section in ["entity", "memory", "state", "meta"]:
        if section in data:
            for field in REQUIRED_FIELDS[section]:
                if field not in data[section]:
                    errors.append(f"Missing {section}.{field}")
    
    # Validate types
    if "meta" in data:
        if "round" in data["meta"] and not isinstance(data["meta"]["round"], int):
            errors.append("meta.round must be integer")
    
    if "state" in data:
        if "pending_threads" in data["state"] and not isinstance(data["state"]["pending_threads"], list):
            errors.append("state.pending_threads must be array")
    
    # Report results
    if errors:
        print(f"❌ Validation FAILED\n")
        for error in errors:
            print(f"   • {error}")
        return False
    else:
        print(f"✅ Validation PASSED\n")
        print(f"   Entity: {data.get('entity', {}).get('name', 'N/A')}")
        print(f"   Round: {data.get('meta', {}).get('round', 'N/A')}")
        print(f"   Model: {data.get('meta', {}).get('source_model', 'N/A')}")
        print(f"   Pending threads: {len(data.get('state', {}).get('pending_threads', []))}")
        return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_skeleton.py <file.json>")
        print("\nThis is the public validator. Full validation suite available under license.")
        print("Contact: andy80116@gmail.com")
        sys.exit(1)
    
    filepath = sys.argv[1]
    success = validate_sic_state(filepath)
    
    print(f"\n{'='*60}")
    print("Full SIC Protocol includes:")
    print("  • Tension Field validation")
    print("  • Residue Graph integrity checks")
    print("  • Cross-model drift detection")
    print("  • S★ calibration verification")
    print("\nFull specification requires licensing: andy80116@gmail.com")
    print(f"{'='*60}\n")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
