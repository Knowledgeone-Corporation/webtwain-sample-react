using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SampleWebsiteReact.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly IWebHostEnvironment _hostingEnvironment;

        public HomeController(IWebHostEnvironment environment)
        {
            this._hostingEnvironment = environment;
        }

        [HttpGet]
        public string Get()
        {
            var rng = new Random();
            return rng.Next(100).ToString();
        }

        [HttpPost]
        [Route("uploadfile")]
        public IActionResult UploadFile(IFormFile file, string clientid)
        {
            var uploads = Path.Combine(_hostingEnvironment.ContentRootPath, $"uploads\\{clientid}");

            if (!Directory.Exists(uploads))
                Directory.CreateDirectory(uploads);

            var colFiles = Directory.GetFiles(uploads, "*", SearchOption.AllDirectories);
            foreach (var strExistingFile in colFiles)
                System.IO.File.Delete(strExistingFile);

            if (file.Length > 0)
            {
                var filePath = Path.Combine(uploads, file.FileName);
                using FileStream fileStream = new FileStream(filePath, FileMode.Create);
                file.CopyTo(fileStream);
            }

            var docGuid = Guid.NewGuid();
            var fileInfo = new
            {
                filename = file.FileName,
                fileSize = file.Length
            };

            var response = new
            {
                info = fileInfo,
                uniqueId = docGuid.ToString(),
                uploadDate = DateTime.Now
            };

            return Ok(response);
        }

        [HttpGet]
        [Route("downloadsetup")]
        public IActionResult DownloadSetup()
        {
            var userAgent = Request.Headers["User-Agent"].ToString();
            if (userAgent.ToLower().Contains("mac os"))
            {
                return File("~/files/K1ScanService.pkg", "application/octet-stream", "K1ScanService.pkg");
            }
            else
            {
                return File("~/files/K1ScanService.msi", "application/octet-stream", "K1ScanService.msi");
            }
        }

        [HttpGet]
        [Route("K1Licence")]
        public IActionResult K1Licence()
        {
            return PhysicalFile(Path.Combine(_hostingEnvironment.ContentRootPath, "Keys/Webtwainsdk.lic"), "text/plain");
        }
    }
}
