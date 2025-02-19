var nodes = require('../nodes.json')
var http = require('ava-http');
var h = require('../helpers/helper-functions')

async function queryRoutes(t, index1, index2, index3){
//CHECK THAT NODE EXISTS AND IS ITS OWN FIRST CONTACT ===>

    const nodeArray = [index1, index2]
    if(typeof(index3) === 'number') nodeArray.push(index3)

    await h.asyncForEach(nodeArray, async n => {
        await h.asyncForEach(nodeArray, async i => {
            if(n===i) return
            var checker = nodes[n]
            var checkee = nodes[i]
            
            let q = `pubkey=${checkee.pubkey}`
            if(checkee.routeHint) {
                q += `&route_hint=${checkee.routeHint}`
            }
            var route = await http.get(checker.ip+`/route?${q}`, h.makeArgs(checker))
            t.truthy(route.response.success_prob, "success prob should be greater than 0")

            console.log(`${checker.alias} routed to ${checkee.alias}`)
        })
    })
}

module.exports = queryRoutes