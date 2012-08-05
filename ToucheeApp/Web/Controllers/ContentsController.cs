using System;   
using System.Collections.Generic;
using System.Linq;
using System.Text;

using HttpServer.Headers;
using Touchee.Web.Messages;
using Touchee.Artwork;
using System.Drawing;
using System.IO;

namespace Touchee.Web {
    public enum ArtworkSize {
        Small   = 43,
        Medium  = 128,
        Large   = 748
    }
}

namespace Touchee.Web.Controllers {

    public class ContentsController : ApplicationController {
        public override object Clone() { return new ContentsController(); }

        /// <summary>
        /// Get artwork
        /// </summary>
        public bool Artwork() {
            
            // Get requested artwork size
            int width, height, ratio = 1;
            var size = ArtworkSize.Medium;
            Enum.TryParse<ArtworkSize>(GetStringParam("size"), true, out size);
            TryGetIntParam("width", out width);
            TryGetIntParam("height", out height);
            TryGetIntParam("ratio", out ratio);
            width = Math.Max(0, width);
            height = Math.Max(0, height);
            ratio = Math.Max(1, ratio);
            var resizeMode = ResizeMode.Cover;
            Enum.TryParse<ResizeMode>(GetStringParam("resizeMode"), true, out resizeMode);

            // No params? Go for default
            if ((int)size == 0 && width + height == 0)
                size = ArtworkSize.Medium;

            // No enum size available? Get from width and height
            if ((int)size == 0) {
                size = ArtworkSize.Small;
                if (width > (int)size || height > (int)size)
                    size = ArtworkSize.Medium;
                if (width > (int)size || height > (int)size)
                    size = ArtworkSize.Large;
            }

            // Go from enum to int
            else
                width = height = (int)size;

            // Do ratio
            width *= ratio;
            height *= ratio;

            // Get container
            int containers_id = GetIntParam("containers_id");
            if (containers_id == 0) return false;
            var container = Container.Find(containers_id);

            // Get the itemID if it exists
            int itemID;
            TryGetIntParam("item", out itemID);

            // Vars
            Options filter = null;
            IItem item = null;
            ArtworkResult result = null;

            // Get the artwork based on the input
            if (itemID > 0) {
                item = container.GetItem(itemID);
                result = Library.Artwork(container, item, Client, Request.Uri);
            }
            else {
                filter = Options.Build(GetStringParam("item"));
                if (filter.Count > 0)
                    result = Library.Artwork(container, filter, Client, Request.Uri);
                else
                    return false;
            }

            // Set source artwork (before resize);
            var sourceArtwork = result.Artwork;

            // Unknown result? Give 404
            if (result.Status == ArtworkStatus.Unknown) {
                sourceArtwork = null; // Just to be sure
            }
            
            // Else, give default image if we have no artwork (yet)
            else if (sourceArtwork == null) {

                // Get some vars
                var unavailable = result.Status == ArtworkStatus.Unavailable;
                var type = result.Type;
                var imagePath = String.Format("/app/assets/images/artwork/{0}/{1}.png", size.ToString().ToLower(), type);

                // We actually just want to do a redirect here, but Webkit browsers seem to cache 307 responses (which they shouldn't accoring to HTTP spec)
                //Response.Status = unavailable ? System.Net.HttpStatusCode.MovedPermanently : System.Net.HttpStatusCode.TemporaryRedirect;
                //Response.AddHeader("Location", Request.Uri.GetLeftPart(UriPartial.Authority) + "/app/assets/images/artwork/" + size + "/" + typeStr + ".png");

                // So instead we just present the default image
                try {
                    sourceArtwork = new Bitmap(Program.WebServerPath + imagePath, true);
                }
                catch (Exception) {
                    sourceArtwork = null;
                }

                // Set cache if artwork is unavailable
                if (unavailable)
                    this.SetArtworkCache();

                //else {
                //    Response.AddHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
                //    Response.AddHeader("Expires", "0");
                //    Response.AddHeader("Pragma", "no-cache");
                //}

            }

            // Else, set cache if artwork was found
            else {
                this.SetArtworkCache();
            }


            // We can serve an image
            if (sourceArtwork != null) {
                Image targetArtwork;

                // Resize artwork if requested
                if (width == 0 ^ height == 0) {
                    var d = width == 0 ? height : width;
                    targetArtwork = sourceArtwork.Resize(new Size(d, d), resizeMode);
                    sourceArtwork.Dispose();
                }
                else if (width > 0 && height > 0) {
                    targetArtwork = sourceArtwork.Resize(new Size(width, height), resizeMode);
                    sourceArtwork.Dispose();
                }
                else
                    targetArtwork = sourceArtwork;

                // Output artwork
                using (var stream = new MemoryStream()) {
                    targetArtwork.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                    byte[] bytes = stream.ToArray();
                    Response.ContentType = new ContentTypeHeader("image/png");
                    Response.Body.Write(bytes, 0, bytes.Length);
                    //try { Response.Send(); }
                    //catch (Exception) { return false; }
                }
                targetArtwork.Dispose();
            }
            
            // Return true if an image was returned
            return sourceArtwork != null;
        }


        /// <summary>
        /// Sets the cache period for the artwork
        /// </summary>
        int artworkcacheDuration = -1;
        void SetArtworkCache() {
            int seconds = artworkcacheDuration;
            if (seconds < 0) {
                Program.Config.TryGetInt("artwork.cacheDuration", out seconds);
                artworkcacheDuration = Math.Max(seconds, 0);
            }
            Response.Add(new StringHeader("Cache-Control", "max-age=" + seconds.ToString()));
        }



    }
}







