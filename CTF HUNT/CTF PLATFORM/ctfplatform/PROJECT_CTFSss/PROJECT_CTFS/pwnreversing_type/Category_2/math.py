# math.py

target_sum = 221

key = input("Enter the 3-letter secret key: ")

if len(key) != 3:
    print("Key must be 3 letters long.")
    exit()

# Calculate the sum of the ASCII (ord) values of the input
input_sum = ord(key[0]) + ord(key[1]) + ord(key[2])

if input_sum == target_sum:
    # The actual flag is hardcoded here, but the player only sees this message:
    print("Success! The key is valid.")
    print("Your flag is: flag{b4s1c_4sci1_m4th}")
else:
    print(f"Sum was {input_sum}. Access Denied. Required sum is {target_sum}.")