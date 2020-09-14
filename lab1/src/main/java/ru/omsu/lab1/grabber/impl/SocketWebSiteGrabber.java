package ru.omsu.lab1.grabber.impl;

import ru.omsu.lab1.WebSiteEntity;
import ru.omsu.lab1.grabber.WebSiteGrabber;
import ru.omsu.lab1.parser.impl.SocketWebSiteParser;

import java.io.*;
import java.net.InetAddress;
import java.net.Socket;

public class SocketWebSiteGrabber implements WebSiteGrabber {

    private SocketWebSiteParser parser;
    public static final int PORT = 80;

    public SocketWebSiteGrabber() {
        parser = new SocketWebSiteParser();
    }

    @Override
    public WebSiteEntity fetchWebSite(String url) throws IOException {
        final InetAddress inetAddress = InetAddress.getByName(url);

        try (
                Socket client = new Socket(inetAddress, PORT);
                PrintStream outStream = new PrintStream(client.getOutputStream());
                BufferedReader inStream = new BufferedReader(new InputStreamReader(client.getInputStream()))
        ) {

            outStream.println("GET " + url + " HTTP/1.0");
            outStream.println();

            String line;
            StringBuilder stringBuilder = new StringBuilder();
            while ((line = inStream.readLine()) != null) {
                stringBuilder
                        .append(line)
                        .append("\n");
            }

            return parser.parse(stringBuilder.toString());
        }
    }
}
