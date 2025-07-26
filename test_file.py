import hashlib

row1 = "SHANTIGOLD,Shanti Gold International Limited,EQ,25-Jul-2025,2025-07-29,Active,12667200.0,Rs.189 to Rs.199,,,,"
row2 = "SHANTIGOLD,Shanti Gold International Limited,EQ,25-Jul-2025,2025-07-29,Active,12667200.0,Rs.189 to Rs.199,,,,"

print(row1 == row2)  # Will return False
# print(list(row1))    # See character-by-character
# print(list(row2))    # Compare side by side

def compute_hash_from_string(s):
    s = s.strip()  # remove leading/trailing whitespace
    return hashlib.md5(s.encode('utf-8')).hexdigest()
  
print("row1 hash "+compute_hash_from_string(row1))
print("row2 hash "+compute_hash_from_string(row2))

