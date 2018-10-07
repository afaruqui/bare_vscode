'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

    let extensionPath = context.extensionPath;
    let mediaPath = path.join(extensionPath, 'resources');

    console.log(`Extension "testd3" is now active, running from ${extensionPath}.`);
    console.log(`Media path ${fs.existsSync(mediaPath)?"":"not "}found.`);

    let kittenPath = vscode.Uri.file(path.join(mediaPath, 'kitten.jpg')).with({ scheme : 'vscode-resource'});

    let currentPanel : vscode.WebviewPanel | undefined = undefined;

    let createPanelDisposable = vscode.commands.registerCommand('extension.testD3js', () => {
       if (currentPanel) {
         currentPanel.reveal(vscode.ViewColumn.Two);
       } else {
         currentPanel = vscode.window.createWebviewPanel("testType", "Panel display", vscode.ViewColumn.Two, { enableScripts : true } );
         currentPanel.title = "Testing Panel";
         //currentPanel.webview.html = getHtmlContent(kittenPath);
        currentPanel.webview.html = getHtmlContent2(extensionPath);

         currentPanel.onDidDispose(
             () => { currentPanel = undefined; },
             undefined,
             context.subscriptions
         );
         currentPanel.webview.onDidReceiveMessage(msg => {
            vscode.window.showInformationMessage(`Seems like I got a message ${msg.command}!`);
         }, undefined, context.subscriptions);
       }
       // Display a message box to the user
       vscode.window.showInformationMessage('[aspirational] displaying a d3-powered view!');
    });

    let talkPanelDisposable = vscode.commands.registerCommand("extension.talkD3js", () => {
        if (!currentPanel) {
            vscode.window.showInformationMessage('Need to have the webview open');
        } else {
            vscode.window.showInformationMessage('Sending a message to the webview');
            currentPanel.webview.postMessage({ command : 'refactor'});
        }
    });

    context.subscriptions.push(createPanelDisposable);
    context.subscriptions.push(talkPanelDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    /* empty */
}

function getHtmlContent2(extensionPath : string) : string {
    let resourcePath = path.join(extensionPath, 'resources');
    let html = fs.readFileSync(path.join(resourcePath, "index.html"), "utf8");
    return html;
}

function getHtmlContent(imgUri : vscode.Uri) : string {
    let htmlContent : string =`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="with=device-width, initial-scale=1.0">
    <script src="https://d3js.org/d3.v4.min.js"></script>
    <style>
    .bar-chart {
        background-color : #c7d9d9;
    }
    </style>
  </head>
  <body>
    <h1>The kitten with scripts</h1>
    <img src="${imgUri}" width="300" />

    <h2>Local lines counter</h2>
    <div id="lines-of-code-counter">0</div>

    <h2>Latest communication from host</h2>
    <div id="latest-comm"></div>

    <h2>Visualization</h2>
    <div class="vizdiv">
         Hello World!
    </div>

    <h2>SVG visualization</h2>
    <!--
    <div id="infovizDiv">
      <svg style="width:500px;height:500px;border:1px lightgray solid;">
        <path d="M 10,60 40,30 50,50 60,30 70,80" style="fill:black;stroke:gray;stroke-width:4px;" />
        <polygon style="fill:gray;" points="80,400 120,400 160,440 120,480 60,460" />
        <g>
            <line x1="200" y1="100" x2="450" y2="225" style="stroke:black;stroke-width:2px;"/>
            <circle cy="100" cx="200" r="30"/>
            <rect x="410" y="200" width="100" height="50" style="fill:pink;stroke:black;stroke-width:1px;" />
        </g>                                                                                                                                                                                                                                       </svg>                                                                                                                                                                                                                                     
    </div>
    -->
    <svg class="bar-chart"></svg>  

    <script>
    (function () {
        const vscode = acquireVsCodeApi();
        const counter = document.getElementById("lines-of-code-counter");
        const commMsg = document.getElementById("latest-comm");

        let count = 0;
        setInterval( () => {
            counter.textContent = count++;
            if ((count % 250) === 0) {
                console.log("Sending a message to the host...");
                vscode.postMessage({
                    command: 'alert',
                    text: 'communicating with host'
                });
            }
        }, 500);

        // trying the code from https://medium.freecodecamp.org/how-to-create-your-first-bar-chart-with-d3-js-a0e8ea2df386
        let dataset = [80, 100, 56, 120, 180, 30, 40, 120, 160]; 
        let svgWidth = 500;
        let svgHeight = 300;
        let barPadding = 5;
        let barWidth = (svgWidth / dataset.length);

        let svg = d3.select("svg").attr("width", svgWidth).attr("height", svgHeight);
        let barChart = svg.selectAll("rect")
                          .data(dataset)
                          .enter()
                          .append("rect")
                          .attr("y", function(d) { return svgHeight - d; })
                          .attr("height", function(d) { return d; } )
                          .attr("width", function(d) { return barWidth - barPadding; })
                          .attr("transform", function(d,i) {
                            let translate = [ barWidth * i, 0];
                            return "translate(" + translate + ")";
                          });

        // Handle a message inside the webview
        window.addEventListener('message', event => {
            const message = event.data; // the message data the host sent
            commMsg.textContent = "Just received a message at time [" + count + "]";
            console.log("This should be displayed in the developer tools if they're open");
        });
    })();
    </script>
  </body>
</html>
`;
    return htmlContent;
}