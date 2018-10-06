using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreMVC.Controllers
{
    public class BusyController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        // https://www.codeproject.com/Articles/1095434/Show-an-animation-while-waiting-for-a-download-to
        [HttpPost]
        public FileResult Download(string cookieValue)
        {
            // wait 10 seconds to simulate a long running operation
            System.Threading.Thread.Sleep(10000);

            // create a dummy text file to download
            var sb = new StringBuilder();
            sb.AppendLine("This is a demo file that has been generated on the server.");
            sb.AppendLine();
            for (int i = 1; i <= 1000; i++)
            {
                sb.AppendLine("Line " + i.ToString() + "  " + DateTime.Now.ToString());
            }

            // add a cookie with the name 'dlc' and the value from the postback
            Response.Cookies.Append("dlc", cookieValue);

            return File(Encoding.ASCII.GetBytes(sb.ToString()), "text/plain", "data.txt");
        }
    }
}