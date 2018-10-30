const fs = require('fs');
var exec = require('child_process').exec;

const configPath = "config.json";
const serverPath = "server.json";

const loadConfig = function () {

    let configFile = fs.readFileSync(configPath);
    const config = JSON.parse(configFile.toString());

    let serverFile = fs.readFileSync(serverPath);
    const servers = JSON.parse(serverFile.toString());

    const upstreamFilePath = config.upstream_file;
    let upstreamContent = "";

    if (config.sorted) {
        config.upstreams.sort((a, b) => {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        });
    }

    config.upstreams.forEach(upstream => {
        upstreamContent += `upstream ${upstream.name} {\n`;
        upstreamContent += "\tip_hash;\n\n"
        servers.forEach(server => {
            upstreamContent += `\t${server.name}:${upstream.port};\n`
        });
        upstreamContent += "}\n\n"
    });

    fs.writeFile(upstreamFilePath, upstreamContent, function (err) {
        if (err) console.log(err);
        console.log(`Successfully written config file to ${upstreamFilePath}.`);
    });

    if (config.reload_nginx_config) {
        exec(config.reload_nginx_command, function (err, stdout, stderr) {
            if (err) {
                console.error("Something is wrong.");
                console.error(err);
            }
            else {
                console.info("nginx config reloaded.");
                console.info(stdout);
            }
        });
    }
}

fs.watchFile(configPath, loadConfig);
fs.watchFile(serverPath, loadConfig);

loadConfig();