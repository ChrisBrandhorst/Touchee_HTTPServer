using System;
using System.Diagnostics;
using System.IO;

namespace MayoSolutions.iTunes.ITCParser
{
    internal struct ITCFILE_HEADER2
    {
        public string item;

        public int headerLength;

        public string libraryPersistentId;
        public string trackPersistentId;

        public string downloadIndicator;
        public string fileFormatIndicator;

        public int width;
        public int height;

        public void Read(Stream strm)
        {
            long position = strm.Position;
            BinaryReader br = new BinaryReader(strm);

            // 4 bytes of disposable info
            strm.Position += 4;

            this.item = new string(br.ReadChars(4));    //69 74 65 6D "item"

            // Read the entire length of the data header
            this.headerLength = BitConversion.GetUInt32(br.ReadBytes(4));

            // 16 bytes of disposable info
            strm.Position += 16;

            // If header length is 216 rather than 212, consume another 4 bytes
            // before getting more information
            if (this.headerLength == 216) strm.Position += 4;

            // Get the library and track persistent Id's
            this.libraryPersistentId = BitConversion.GetHexString(br.ReadBytes(8));
            this.trackPersistentId = BitConversion.GetHexString(br.ReadBytes(8));

            // Read the download/persistence indicator
            this.downloadIndicator = new string(br.ReadChars(4));    // "down" or "locl"

            // Read the pseudo-file format
            //byte[] format = br.ReadBytes(4);
            //Debug.Assert(format.Equals(System.Text.Encoding.Default.GetBytes("PNGf")), "format indicator is '" + System.Text.Encoding.Default.GetString(format) + "'");
            //this.fileFormatIndicator = System.Text.Encoding.Default.GetString(format);
            this.fileFormatIndicator = new string(br.ReadChars(4));

            // 4 bytes of disposable info
            strm.Position += 4;

            // Read width and height of image
            this.width = BitConversion.GetUInt32(br.ReadBytes(4));
            this.height = BitConversion.GetUInt32(br.ReadBytes(4));

            // Reset position to end of header (beginning of "null buffer")
            strm.Position = position + (long)this.headerLength;
        }
    }
}
