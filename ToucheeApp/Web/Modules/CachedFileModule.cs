using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using HttpServer;
using HttpServer.Modules;
using HttpServer.Headers;
using HttpServer.Resources;

namespace Touchee.Web.Modules {

    /// <remarks>
    /// Serves files in the web server with caching.
    /// </remarks>
    /// <example>
    /// <code>
    /// CachedFileModule fileModule = new CachedFileModule(360);
    /// fileModule.Resources.Add(new FileResources("/", "C:\\inetpub\\myweb"));
    /// </code>
    /// </example>
    public class CachedFileModule : IModule {

        /// <summary>
        /// The caching duration in seconds
        /// </summary>
        public int CacheDuration { get; protected set; }

        /// <summary>
        /// The FileModule which is used internally
        /// </summary>
        FileModule _fileModule = new FileModule();

        /// <summary>
        /// Constructs a new cached file module which informs the client that
        /// all files should be cached for the given amount of seconds.
        /// </summary>
        /// <param name="seconds">The time in seconds which the client needs to cache the files</param>
        /// <exception cref="ArgumentException">If seconds is smaller than 0</exception>
        public CachedFileModule(int seconds) : base() {
            if (seconds < 0)
                throw new ArgumentException("Must be greater than 0", "seconds");
            this.CacheDuration = seconds;
        }

        /// <summary>
        /// Gets a list with all allowed content types. 
        /// </summary>
        /// <remarks>All other mime types will result in <see cref="HttpStatusCode.Forbidden"/>.</remarks>
        public IDictionary<string, ContentTypeHeader> ContentTypes {
            get { return _fileModule.ContentTypes; }
        }

        /// <summary>
        /// Gets provider used to add files to the file manager,
        /// </summary>
        public IResourceProvider Resources {
            get { return _fileModule.Resources; }
        }

        /// <summary>
        /// Process a request.
        /// </summary>
        /// <param name="context">Request information</param>
        /// <returns>What to do next.</returns>
        /// <exception cref="InternalServerException">Failed to find file extension</exception>
        /// <exception cref="ForbiddenException">Forbidden file type.</exception>
        public ProcessingResult Process(RequestContext context) {
            var processingResult = _fileModule.Process(context);
            if (CacheDuration > 0)
                context.Response.Add(new StringHeader("Cache-Control", "max-age=" + CacheDuration.ToString()));
            return processingResult;
        }

    }

}
