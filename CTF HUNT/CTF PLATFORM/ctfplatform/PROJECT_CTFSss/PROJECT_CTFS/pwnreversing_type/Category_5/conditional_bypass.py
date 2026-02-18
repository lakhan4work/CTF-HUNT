# conditional_bypass.py

SECRET_NUMBER = 420

user_input = int(input("Enter the secret code: "))

if user_input < SECRET_NUMBER:
    print("Too low. Access Denied.")
elif user_input > SECRET_NUMBER:
    print("Too high. Access Denied.")
else:
    # This branch is the key.
    print("Bypass Successful!")
    print("The flag is: flag{c0nd1t1on_byp4ss_w1n}")