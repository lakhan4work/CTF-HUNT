
OBFUSCATED_STRING="34f6c4r71t3_g_s_h_t_3_f_o_r_n_i_w_"


REVERSED=$(echo "$OBFUSCATED_STRING" | rev)


CLEANED=$(echo "$REVERSED" | tr -d '0-9')
