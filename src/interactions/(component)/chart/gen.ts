import Command, { CommandType } from "../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "achart_<type>_<userId>" })
    .attach('run', async ({}) => {
        // if (interaction.type !== 3) return;

        // variables.type = parseInt(variables.type);

        // let ding = [epicduel.counter.exile.map(v => [new Date(v[0]).getMinutes(), v[1], v[2]]), epicduel.counter.legion.map(v => [new Date(v[0]).getMinutes(), v[1], v[2]])];

        // let dong = {
        //     exile: [], legion: []
        // };

        // for (let x = 0; x < ding.length; x++) {
        //     let last = -1; let firstile = -1;

        //     for (let y = 0; y < ding[x].length; y++) {
        //         if (last === ding[x][y][0] || (last === -1 && ding[x][y][0] %  5 !== 0)) continue;
        //         if (firstile === 69) break;
        //         if (ding[x][y][0] === firstile) firstile = 69;

        //         dong[x === 0 ? "exile" : "legion"].push(ding[x][y]);
        //         if (last === -1) firstile = ding[x][y][0];
        //         last = ding[x][y][0];
        //     }
        // }

        // if (dong.exile.length < 10) return interaction.createMessage({ content: "fail 1", flags: 64 });

        // let labels = [];
        // for (let sin = 0; sin < dong.exile.length; sin++) {
        //     if (dong.exile[sin][0] % 5 !== 0) labels.push("");
        //     else if (dong.exile[sin][0] < dong.exile[sin][0]) labels.push("yy:" + dong.exile[sin][0]);
        //     else labels.push("xx:" + dong.exile[sin][0]);
        // }; labels

        // if (!global.opts) global.opts = {
        //     "type": "line",
        //     "data": {
        //         "labels": labels,
        //         "datasets": [{
        //             "label": "Exile",
        //             "borderColor": "rgb(255,+99,+132)",
        //             "backgroundColor": "rgba(255,+99,+132,+.5)",
        //             "data": dong.exile.map(v => v[1]), "fill": false
        //         }, {
        //             label: "Legion",
        //             "borderColor": "rgb(75, 192, 192)",
        //             "data": dong.legion.map(v => v[1]), "fill": false
        //         }]
        //     },
        //     "options": {
        //         "title": {
        //         "display": true,
        //         "text": "Line Chart"
        //         },
        //         "scales": {
        //             "xAxes": [{
        //                 "scaleLabel": {
        //                     "display": true,
        //                     "labelString": "Time"
        //                 }
        //             }],
        //             "yAxes": [{
        //                 "stacked": false,
        //                 "scaleLabel": {
        //                     "display": true,
        //                     "labelString": "Points"
        //                 }
        //             }]
        //         }
        //     }
        // }

        // global.opts.data.labels = labels;
        // global.opts.data.datasets[0].data = dong.exile.map(v => v[1]);
        // global.opts.data.datasets[1].data = dong.legion.map(v => v[1]);

        // await interaction.defer()

        // let img = await (new ChartJSImage(global.opts).chart(global.opts).bkg("white").width(2000).height(1000).toBuffer());

        // return interaction.createFollowup({
        //     files: [{
        //         contents: img, name: "img.png"
        //     }], content: "ohk"
        // });
    })