# char_shift.py

def decode_char(c):
    # Shift every non-symbol character back by 2 positions
    if 'a' <= c <= 'z':
        # 97 is ord('a')
        return chr(((ord(c) - 97 - 2) % 26) + 97)
    elif '0' <= c <= '9':
        # 48 is ord('0')
        return chr(((ord(c) - 48 - 2) % 10) + 48)
    else:
        return c

# This is the original flag, shifted by +2
ENCODED_FLAG = "hncj{t3x_hwpeviqn_ej4nncpg}"

# The flag is printed after the user has analyzed the decode_char function.
print("The flag is encoded. Analyze the 'decode_char' function to figure out the original flag.")

# Run the decoding logic here.
decoded_flag = "".join(decode_char(c) for c in ENCODED_FLAG)
print(f"Decoded flag: {decoded_flag}")