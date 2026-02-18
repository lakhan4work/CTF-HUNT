#include <stdio.h>

void print_junk() {
    // The flag is stored here, but not printed directly.
    char secret_data[] = "13579flag{st4ck_sm4sh1ng_c0ncept}97531"; 

    // This function prints unrelated data, but the flag data is in the stack frame.
    printf("Starting program...\n");
    printf("Junk data: %p\n", (void *)secret_data); // Print address, not content

    // The program just exits. In a real exploit, you'd overflow a buffer
    // to read this variable, but here we provide a hint.
    printf("Data is stored in the memory just above the current output.\n");
}

int main() {
    print_junk();
    return 0;
}