package ru.omsu.lab1;

import ru.omsu.lab1.grabber.WebSiteGrabber;
import ru.omsu.lab1.grabber.impl.SocketWebSiteGrabber;
import ru.omsu.lab1.grabber.impl.UrlConnectionWebSiteGrabber;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;

public class Main {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Please specify URL");
            return;
        }

        String webSiteUrl = args[0];
        try {
            System.out.println("\n\nGrabbing website with Socket: \n");
            Main.grabWebSite(new SocketWebSiteGrabber(), webSiteUrl);

            System.out.println("\n\nGrabbing website with UrlConnection: \n");
            Main.grabWebSite(new UrlConnectionWebSiteGrabber(), webSiteUrl);
        } catch (Exception e) {
            System.out.println(e);
            System.out.println("Some troubles with grabbing web site");
        }
    }

    public static void grabWebSite(WebSiteGrabber webSiteGrabber, String webSiteUrl) throws IOException {
        WebSiteEntity webSiteEntity = webSiteGrabber.fetchWebSite(webSiteUrl);
        String fileName = webSiteUrl + '.' + webSiteGrabber.getClass().getSimpleName();
        Main.exportWebSite(webSiteEntity, fileName);
    }

    public static void exportWebSite(WebSiteEntity webSiteEntity, String name) throws FileNotFoundException {
        System.out.println(webSiteEntity.getHeaders());

        final String fileName = name + ".txt";
        try (PrintStream out = new PrintStream(new FileOutputStream(fileName))) {
            out.print(webSiteEntity.getBody());
        }
    }
}
