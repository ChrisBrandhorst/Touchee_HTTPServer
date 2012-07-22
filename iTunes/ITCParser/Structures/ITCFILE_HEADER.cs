using System;
using System.IO;

namespace MayoSolutions.iTunes.ITCParser
{
    internal struct ITCFILE_HEADER
    {
        public int headerLength;
        public string itch;

        public string artw;

        public void Read(Stream strm)
        {
            long position = strm.Position;
            BinaryReader br = new BinaryReader(strm);

            // Self-describing header length
            this.headerLength = BitConversion.GetUInt32(br.ReadBytes(4));   //00 00 01 1C

            this.itch = new string(br.ReadChars(4));    //69 74 63 68 "itch"

            // 16 bytes of disposable info
            strm.Position += 16;

            this.artw = new string(br.ReadChars(4));    //61 72 74 77 "artw"

            // Reset position to end of header (beginning of "null buffer")
            strm.Position = position + (long)this.headerLength;
        }
    }
}
