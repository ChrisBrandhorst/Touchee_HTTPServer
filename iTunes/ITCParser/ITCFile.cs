using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;

//http://www.waldoland.com/Dev/Articles/ITCFileFormat.aspx
//http://www.falsecognate.org/2007/01/deciphering_the_itunes_itc_fil/
//http://www.command-tab.com/2006/09/12/itunes-art-redux/

namespace MayoSolutions.iTunes.ITCParser
{
    public class ITCFile
    {

        private string _filePath = string.Empty;
        private string _fileName = string.Empty;

        private byte[] m_imageData = new byte[] { };

        private string _libraryPersistentId = string.Empty;
        private string _trackPersistentId = string.Empty;
        private bool _downloaded = false;
        private int _height = 0;
        private int _width = 0;
        private ImageTypeEnum _imageType = ImageTypeEnum.Unknown;

        public enum ImageTypeEnum : int
        {
            Unknown = 0,
            PNG = 1,
            JPEG = 2
        }

        /// <summary>
        /// Path to the .itc file.
        /// </summary>
        [Description("Path to the .itc file.")]
        public string FilePath
        {
            get { return this._filePath; }
        }

        /// <summary>
        /// Name of the .itc file.
        /// </summary>
        [Description("Name of the .itc file.")]
        public string FileName
        {
            get { return this._fileName; }
        }

        /// <summary>
        /// Raw image data parsed from the .itc file.
        /// </summary>
        [Browsable(false)]
        [Description("Raw image data parsed from the .itc file.")]
        public byte[] ImageData
        {
            get { return this.m_imageData; }
        }

        /// <summary>
        /// iTunes Library identifier.
        /// </summary>
        [Description("iTunes Library identifier.")]
        public string LibraryPersistentId
        {
            get
            {
                if (this._libraryPersistentId == null) this._libraryPersistentId = string.Empty;
                return this._libraryPersistentId;
            }
        }


        /// <summary>
        /// iTunes track identifier.
        /// </summary>
        [Description("iTunes track identifier.")]
        public string TrackPersistentId
        {
            get
            {
                if (this._trackPersistentId == null) this._trackPersistentId = string.Empty;
                return this._trackPersistentId;
            }
        }

        /// <summary>
        /// Whether CoverFlow has persisted this file from a download or a local source.
        /// </summary>
        [Description("Whether CoverFlow has persisted this file from a download or a local source.")]
        public bool Downloaded
        {
            get { return this._downloaded; }
        }

        /// <summary>
        /// Width of the image, specified by the .itc file.
        /// </summary>
        [Description("Width of the image, specified by the .itc file.")]
        public int Width
        {
            get { return this._width; }
        }

        /// <summary>
        /// Width of the image, specified by the .itc file.
        /// </summary>
        [Description("Width of the image, specified by the .itc file.")]
        public int Height
        {
            get { return this._height; }
        }

        /// <summary>
        /// Embedded image format.
        /// </summary>
        [Description("Embedded image format.")]
        public ImageTypeEnum ImageType
        {
            get { return this._imageType; }
        }





        public ITCFile(string filePath)
        {
            this._filePath = filePath;
            this._fileName = Path.GetFileName(filePath);
            this.ParseData();
        }

        private void ParseData()
        {
            FileInfo fi = null;

            try
            {
                fi = new FileInfo(this._filePath);
            }
            catch //(Exception ex)
            {
                fi = null;
            }

            if ((fi != null) && (fi.Exists == true))
            {
                FileStream fs = null;
                try
                {
                    fs = fi.OpenRead();

                    if (fs.Length > 0)
                    {
                        ITCFILE_HEADER hdr = new ITCFILE_HEADER();
                        ITCFILE_HEADER2 data = new ITCFILE_HEADER2();

                        try
                        {
                            hdr.Read(fs);
                            data.Read(fs);

                            this._downloaded = (bool)(data.downloadIndicator == "down");
                            this._libraryPersistentId = data.libraryPersistentId;
                            this._trackPersistentId = data.trackPersistentId;
                            this._width = data.width;
                            this._height = data.height;

                            int l = (int)(fs.Length - fs.Position);
                            this.m_imageData = new byte[l];
                            fs.Read(this.m_imageData, 0, l);

                            //Quick read for image signature
                            this._imageType = CheckSignature(this.m_imageData);
                        }
                        catch (EndOfStreamException ex)
                        {
                            Debug.WriteLine(ex);
                        }
                    }
                }
                finally
                {
                    if (fs != null) fs.Close();
                }
            }
        }

        private static readonly byte[] ImageSignaturePNG = new byte[] { 0x89, 0x50, 0x4E, 0x47 };
        private static readonly byte[] ImageSignatureJPEG = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };

        private static ImageTypeEnum CheckSignature(byte[] imagedata)
        {
            ImageTypeEnum res = ImageTypeEnum.Unknown;
            if (imagedata != null)
            {
                int i = 0;
                if (imagedata.Length >= ImageSignaturePNG.Length)
                {
                    bool blnSigOK = true;
                    for (i = 0; i < ImageSignaturePNG.Length; i++)
                    {
                        if (imagedata[i] != ImageSignaturePNG[i])
                        {
                            blnSigOK = false;
                            break;
                        }
                        if (blnSigOK == true) return ImageTypeEnum.PNG;
                    }
                }
                if (imagedata.Length >= ImageSignatureJPEG.Length)
                {
                    bool blnSigOK = true;
                    for (i = 0; i < ImageSignatureJPEG.Length; i++)
                    {
                        if (imagedata[i] != ImageSignatureJPEG[i])
                        {
                            blnSigOK = false;
                            break;
                        }
                        if (blnSigOK == true) return ImageTypeEnum.JPEG;
                    }
                }
            }
            return res;
        }


        public static Bitmap GetImage(string filePath)
        {
            return new ITCFile(filePath).ToBitmap();
        }


        public Bitmap ToBitmap()
        {
            Bitmap bmp = null;

            try
            {
                bmp = new Bitmap(new MemoryStream(this.ImageData));
            }
            catch //(Exception ex)
            {
            }

            return bmp;
        }






    }
}
