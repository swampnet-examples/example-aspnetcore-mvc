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
        private readonly int _scale = 1;
        private readonly int _blurSize = 5;
        //private readonly string _img = "test-01.jpg";
        //private readonly string _img = "oct-01.jpg";
        private readonly string _img = "grid.png";

        public CanvasController(IHostingEnvironment env)
        {
            _env = env;
        }

        public IActionResult Index()
        {
            var source = Path.Combine(Path.Combine(_env.WebRootPath, "images"), _img);
            var dest = Path.Combine(Path.Combine(Path.Combine(_env.WebRootPath, "images"), "canvas-buffer"), "x.jpg");

            // Resize and save a copy
            using (var image = Image.Load(source))
            {
                image.Mutate(x => x
                     .Resize(image.Width / _scale, image.Height / _scale));

                image.Save(dest);
            }

            return View();
        }


        [HttpPost]
        public IActionResult Index(RedactionRequest redact)
        {
            var source = Path.Combine(Path.Combine(_env.WebRootPath, "images"), _img);
            var dest = Path.Combine(Path.Combine(Path.Combine(_env.WebRootPath, "images"), "canvas-buffer"), "x.jpg");

            // Resize and save a copy
            using (var image = Image.Load(source))
            {
                foreach(var r in redact.Redactions)
                {
                    image.Mutate(x => x
                        //.Pixelate(_blurSize, new SixLabors.Primitives.Rectangle((int)r.X * _scale, (int)r.Y * _scale, (int)r.W * _scale, (int)r.H * _scale))
                        .BoxBlur(_blurSize, new SixLabors.Primitives.Rectangle((int)r.X * _scale, (int)r.Y * _scale, (int)r.W * _scale, (int)r.H * _scale))
                        );
                }
                image.Save(source);

                image.Mutate(x => x
                     .Resize(image.Width / _scale, image.Height / _scale));
                image.Save(dest);
            }

            return Ok();
        }



        public IActionResult Rotate(RedactionRequest redact)
        {
            var source = Path.Combine(Path.Combine(_env.WebRootPath, "images"), _img);
            var dest = Path.Combine(Path.Combine(Path.Combine(_env.WebRootPath, "images"), "canvas-buffer"), "x.jpg");

            using (var image = Image.Load(source))
            {
                image.Mutate(x => x.Rotate(RotateMode.Rotate90));
                image.Save(source);

                image.Mutate(x => x
                     .Resize(image.Width / _scale, image.Height / _scale));

                image.Save(dest);
            }

            return Ok();
        }
    }


    public class RedactionRequest
    {
        public int id { get; set; }
        public Redact[] Redactions { get; set; }
    }


    public class Redact
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double W { get; set; }
        public double H { get; set; }
    }
}