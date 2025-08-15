I want you to create a chrome extension that will help me find the data on the webpage:

1. when the page is loaded, find the button, by `const button = document.querySelector("a.torrent-modal-download")`
2. click the button programmatically, `button.click()`
3. find the table inside the modal, by `const table = document.querySelector(".modal-download .modal-content table")`

sample table html:

```html
<table class="table">
  <thead>
    <tr>
      <td>Quality</td>
      <td>Name</td>
      <td>Size</td>
      <td>Download</td>
      <td>Magnet</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2160p</td>
      <td>BLURAY</td>
      <td>7.15GB</td>
      <td>
        <a
          download=""
          href="magnet:?xt=urn:btih:F6924FB6FB1C323A02386755FE3B88E0EC9F60CF&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          rel="nofollow"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 2160p"
          ><span class="icon-in" style="color:green"></span
        ></a>
      </td>
      <td>
        <a
          data-torrent-id="80617"
          href="magnet:?xt=urn:btih:F6924FB6FB1C323A02386755FE3B88E0EC9F60CF&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          class="magnet-download download-torrent magnet"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 2160p"
          rel="nofollow"
          style="margin-top: 0;"
          ><span>Magnet</span></a
        >
      </td>
    </tr>

    <tr>
      <td>1080p</td>
      <td>BLURAY</td>
      <td>2.93GB</td>
      <td>
        <a
          download=""
          href="magnet:?xt=urn:btih:65D6A3734D00034ABD9BFFEF4EBE24C42F17BA48&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          rel="nofollow"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 1080p"
          ><span class="icon-in" style="color:green"></span
        ></a>
      </td>
      <td>
        <a
          data-torrent-id="80616"
          href="magnet:?xt=urn:btih:65D6A3734D00034ABD9BFFEF4EBE24C42F17BA48&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          class="magnet-download download-torrent magnet"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 1080p"
          rel="nofollow"
          style="margin-top: 0;"
          ><span>Magnet</span></a
        >
      </td>
    </tr>

    <tr>
      <td>1080p</td>
      <td>BLURAY</td>
      <td>2.93GB</td>
      <td>
        <a
          download=""
          href="magnet:?xt=urn:btih:8C5A4004A6F67BFD373B179FCB7633D9A2E9DE26&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          rel="nofollow"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 1080p"
          ><span class="icon-in" style="color:green"></span
        ></a>
      </td>
      <td>
        <a
          data-torrent-id="115956"
          href="magnet:?xt=urn:btih:8C5A4004A6F67BFD373B179FCB7633D9A2E9DE26&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          class="magnet-download download-torrent magnet"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 1080p"
          rel="nofollow"
          style="margin-top: 0;"
          ><span>Magnet</span></a
        >
      </td>
    </tr>

    <tr>
      <td>720p</td>
      <td>BLURAY</td>
      <td>1.43GB</td>
      <td>
        <a
          download=""
          href="magnet:?xt=urn:btih:D956BACD72C22B54989793B3E8839BD6122625E0&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          rel="nofollow"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 720p"
          ><span class="icon-in" style="color:green"></span
        ></a>
      </td>
      <td>
        <a
          data-torrent-id="80615"
          href="magnet:?xt=urn:btih:D956BACD72C22B54989793B3E8839BD6122625E0&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          class="magnet-download download-torrent magnet"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 720p"
          rel="nofollow"
          style="margin-top: 0;"
          ><span>Magnet</span></a
        >
      </td>
    </tr>

    <tr>
      <td>720p</td>
      <td>BLURAY</td>
      <td>1.43GB</td>
      <td>
        <a
          download=""
          href="magnet:?xt=urn:btih:BCCEC1C902AEC6176AB7ABCC975EC8C505695D4F&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          rel="nofollow"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 720p"
          ><span class="icon-in" style="color:green"></span
        ></a>
      </td>
      <td>
        <a
          data-torrent-id="115955"
          href="magnet:?xt=urn:btih:BCCEC1C902AEC6176AB7ABCC975EC8C505695D4F&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
          class="magnet-download download-torrent magnet"
          title="Download Harry Potter and the Sorcerer's Stone YIFY Torrent 720p"
          rel="nofollow"
          style="margin-top: 0;"
          ><span>Magnet</span></a
        >
      </td>
    </tr>
  </tbody>
</table>
```

4. go through each row of the table, filter out the rows that have:

- if the quality is `2160p` or `1080p`
- and if the name is `BLURAY`

5. extract the `magnet` and `download` link from the row
6. get the page's title and URL
7. then organize the data in the following format:

```json
{
  "title": title,
  "url": url,
  "links": [
    {
      "quality": "2160p",
      "size": "7.15GB",
      "source": "BLURAY",
      "magnet": "magnet:?xt=urn:btih:F6924FB6FB1C323A02386755FE3B88E0EC9F60CF&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce",
      "download": "magnet:?xt=urn:btih:F6924FB6FB1C323A02386755FE3B88E0EC9F60CF&amp;dn=Harry+Potter+and+the+Sorcerer%27s+Stone&amp;tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&amp;tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&amp;tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce"
    },
    ...
  ]
}
```

8. Print out the json data into the console for now.
