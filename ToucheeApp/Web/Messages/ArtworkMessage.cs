using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using System.Drawing;
using System.IO;

namespace Touchee.Web.Messages {

    public class ArtworkMessage : Message {

        public string Url { get; set; }
        public string Data { get; set; }

        public ArtworkMessage(string url, Image image) {
            this.Url = url;
            if (image != null) {
                using (MemoryStream ms = new MemoryStream()) {
                    image.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                    byte[] imageBytes = ms.ToArray();
                    this.Data = Convert.ToBase64String(imageBytes);
                }
            }

        }

    }

}
