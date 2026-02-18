# check.py
# Run this script with Python 3: python3 check.py

correct_key = "PwnMaster42"
flag = "flag{r3v3rs1ng_pyth0n_l0g1c}"

user_input = input("Enter the 11-character secret key: ")

if len(user_input) != 11:
    print("Incorrect length.")
elif user_input == correct_key:
    print(f"Access Granted! Here is your flag: {flag}")
else:
    print("Access Denied.")