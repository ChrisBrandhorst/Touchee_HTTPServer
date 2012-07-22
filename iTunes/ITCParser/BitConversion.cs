using System;
using System.Collections.Generic;
using System.Text;

namespace MayoSolutions.iTunes.ITCParser
{
    internal static class BitConversion
    {

        /// <summary>Takes a Big-Endian Byte array and converts it to its unsigned 32-bit Integer equivalent</summary>
        public static int GetUInt32(byte[] byt)
        {
            return GetUInt32(byt, BitConverter.IsLittleEndian);
        }

        /// <summary>Takes a Big-Endian Byte array and converts it to its unsigned 32-bit Integer equivalent</summary>
        /// <param name="AsBigEndian">Specifies the significance of the bytes in the array.</param>
        public static int GetUInt32(byte[] byt, bool AsBigEndian)
        {
            if (AsBigEndian == BitConverter.IsLittleEndian)
            {
                Array.Reverse(byt);
            }
            return Convert.ToInt32(BitConverter.ToUInt32(byt, 0));
        }

        /// <summary>Takes a Big-Endian Byte array and converts it to its unsigned 16-bit Integer equivalent</summary>
        public static short GetUInt16(byte[] byt)
        {
            return GetUInt16(byt, BitConverter.IsLittleEndian);
        }

        /// <summary>Takes a Big-Endian Byte array and converts it to its unsigned 16-bit Integer equivalent</summary>
        /// <param name="AsBigEndian">Specifies the significance of the bytes in the array.</param>
        public static short GetUInt16(byte[] byt, bool AsBigEndian)
        {
            if (AsBigEndian == BitConverter.IsLittleEndian)
            {
                Array.Reverse(byt);
            }
            return Convert.ToInt16(BitConverter.ToUInt16(byt, 0));
        }


        /// <summary>Gets a hexadecimal string representation of the specified data.</summary>
        /// <param name="data">The data to encode.</param>
        public static string GetHexString(byte[] data)
        {
            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            for (int i = 0; i < data.Length; i++)
            {
                byte b = data[i];
                sb.Append(b.ToString("X2"));
            }
            return sb.ToString();
        }
    }
}
