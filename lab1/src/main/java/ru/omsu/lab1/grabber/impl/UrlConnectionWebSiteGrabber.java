package ru.omsu.lab1.grabber.impl;

import ru.omsu.lab1.WebSiteEntity;
import ru.omsu.lab1.grabber.WebSiteGrabber;
import ru.omsu.lab1.parser.impl.UrlConnectionWebsiteParser;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;

public class UrlConnectionWebSiteGrabber implements WebSiteGrabber {

    public static final String HTTP_PROTOCOL = "https://";
    private UrlConnectionWebsiteParser parser;

    public UrlConnectionWebSiteGrabber() {
        this.parser = new UrlConnectionWebsiteParser();
    }

    @Override
    public WebSiteEntity fetchWebSite(String host) throws IOException {
        BufferedReader reader = null;
        URLConnection connection;

        try {
            URL url = new URL(HTTP_PROTOCOL + host);
            connection = url.openConnection();

            reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder stringBuilder = new StringBuilder();

            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder
                        .append(line)
                        .append("\n");
            }
            return parser.parse(stringBuilder.toString(), connection.getHeaderFields());
        } finally {
            if (reader != null) {
                reader.close();
            }
        }
    }
}
