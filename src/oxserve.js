import { updateStrandsFromDat } from "./file.js";
import {relax_scenario} from "./relax_scenarios.js";
export class OXServeSocket extends WebSocket{
    constructor(url, mesh, top, dat, onUpdate) {
        super(url);
        this.abort = true;

        this.onopen = (resonse) => {
            console.log("connected to nanobase", resonse);
            this.abort = false;
            //this.start_simulation()
        };

        this.onmessage = (response) => {
            if(!this.abort){ //ignore all incomming messages when we stop the simulation
                let message = JSON.parse(response.data);
                if ("console_log" in message){
                    console.log(message["console_log"]);
                }
                if ("dat_file" in message) {
                    onUpdate();
                    this.dat = message["dat_file"];
                    updateStrandsFromDat(message["dat_file"], mesh);
                }
            }
        };
        this.onclose = () => {
            console.log("lost oxServe Connection");
            this.abort = true;
        };
        this.top = top;
        this.dat = dat;
    }

    stop_simulation() {
        this.send("abort");
        this.abort = true;
    }

    start_simulation() {
        this.abort = false;
        let conf = {};
        conf["settings"] = relax_scenario;
        conf["top_file"] = this.top;
        conf["dat_file"] = this.dat;
        this.send(
            JSON.stringify(conf)
        );
    }

    update_forces(forces) {
        if (this.forces === forces) {
            console.log("Forces do not need to be updated");
            return;
        }
        this.forces = forces;
        this.send("abort");
        let conf = {};
        conf["settings"] = relax_scenario;
        conf["trap_file"] = forces;
        conf["top_file"] = this.top;
        conf["dat_file"] = this.dat;
        this.send(
            JSON.stringify(conf)
        );
    }
}
 
export const establishConnection = (mesh, top_file, dat_file, onUpdate) => {
    const url = "wss://nanobase.org:8989";
    return  new OXServeSocket(url, mesh, top_file, dat_file, onUpdate);
};