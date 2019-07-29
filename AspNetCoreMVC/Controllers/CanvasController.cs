using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;

namespace AspNetCoreMVC.Controllers
{
    public class CanvasController : Controller
    {
        private readonly IHostingEnvironment _env;

        public CanvasController(IHostingEnvironment env)
        {
            _env = env;
        }

        public IActionResult Index()
        {
            var source = Path.Combine(Path.Combine(_env.WebRootPath, "images"), "test-01.jpg");
            var dest = Path.Combine(Path.Combine(Path.Combine(_env.WebRootPath, "images"), "canvas-buffer"), "x.jpg");

            // Resize and save a copy
            using (var image = Image.Load(source))
            {
                image.Mutate(x => x
                     .Resize(image.Width / 2, image.Height / 2));

                image.Save(dest);
            }

            return View();
        }
    }
}