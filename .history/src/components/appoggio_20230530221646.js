< !DOCTYPE html >
    <html>
        <head>
            <meta charset="utf-8" />
            <title>Create a draggable point</title>
            <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
            <script src="https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js"></script>
            <link href="https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.css" rel="stylesheet" />
            <style>
                body {margin: 0; padding: 0; }
                #map {position: absolute; top: 0; bottom: 0; width: 100%; }
            </style>
        </head>
        <body>
            <style>
                .coordinates {
                    background: rgba(0, 0, 0, 0.5);
                color: #fff;
                position: absolute;
                bottom: 40px;
                left: 10px;
                padding: 5px 10px;
                margin: 0;
                font-size: 11px;
                line-height: 18px;
                border-radius: 3px;
                display: none;
    }
            </style>

            <div id="map"></div>
            <pre id="coordinates" class="coordinates"></pre>

            <script>
               
            </script>

        </body>
    </html>