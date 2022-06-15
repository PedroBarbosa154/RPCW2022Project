var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');

var path = require('path')
var fs = require('fs')
var multer = require('multer')
var upload = multer({dest: 'uploads'})
const sZip = require('node-stream-zip')
var csum = require("../public/javascripts/checksum")



function existe(a,b){
    for(i=0; i<b.length;i++){
        if (b[i].includes(a)) return i
    }
    return -1
}

/*UPLOAD File */
router.post("/upload", upload.single('myFile') , function(req,res,next){

    var manifesto = 0
    var informacao = 0
    var manifValido = 1
    var infoValida = 1
    var fileList = []
    var metadata = {}
    var manifInfo = {}

    if(req.file.mimetype == "application/zip" || req.file.mimetype == "application/x-zip-compressed"){
        console.log("ZIP File found")
    
        const zip = new sZip({
            file: req.file.path,
            storeEntries : true
        })
        
        zip.on('ready', () => {
            
            for(const entry of Object.values(zip.entries())){
                fileList.push(entry.name)
            }

            // Verificar se o manifesto existe e se os ficheiros mencionados no mesmo existem
            if((index=existe('RRD-SIP.json',fileList))!=-1){
                manifesto = 1
                data = zip.entryDataSync(fileList[index]).toString("utf8")
                manifInfo = JSON.parse(data)

                manifInfo.data.forEach(f => {
                    console.log("Lista de ficheiros: " + fileList)
                    if((index=existe(f.path,fileList))==-1){
                        manifesto = 0
                        manifValido = 0
                        console.log("Ficheiro " + f.path + " não existe!")
                    }
                })
                if(manifesto == 1)
                    console.log("manifesto valido")
            }
            else{

                manifesto = 0
            }

            //  Verificar se os metados existem e estão corretamente preenchidos
            if((index=existe("metadata.json",fileList))!=-1){
                informacao = 1
                data = zip.entryDataSync(fileList[index]).toString("utf8")
                infoInfo = JSON.parse(data)
                if(!(infoInfo.hasOwnProperty('dataCriacao') && infoInfo.hasOwnProperty('titulo') && infoInfo.hasOwnProperty('tipo') && infoInfo.hasOwnProperty('idProdutor'))){
                    informacao = 0
                    infoValida = 0
                    console.log("Info invalida")
                }
                else{
                    metadata.dataCriacao = infoInfo.dataCriacao
                    metadata.idProdutor = infoInfo.idProdutor
                    metadata.titulo = infoInfo.titulo
                    metadata.tipo = infoInfo.tipo
                    console.log("Metadados válidos")
                }
            }
            else{
                informacao = 0
            }

            if(manifesto==1 && informacao==1){
                // Para já fica o que está nos metadados mas posteriormente adicionamos
                // a data em que fizer efetivamente upload e 
                metadata.dataSubmissao = infoInfo.dataSubmissao
                metadata.idSubmissor = infoInfo.idSubmissor
                //metadata.dataSubmissao = new Date().toISOString().substring(0,16).split('T').join(' ')
                //#endregio//metadata.idSubmissor = 
                console.log("Zip valido")
                zip.close()
                next()
            }
            else{
                var warnings = []
                if(manifesto != 1) warnings.push("Confirme que o ZIP tem o ficheiro de manifesto (RRD-SIP.json)!");
                if(informacao != 1) warnings.push("Confirme que o ZIP tem o ficheiro de metadados (metadata.json)!");
                if(manifValido != 1) warnings.push("Confirme que o conteúdo do ficheiro de manifesto está correto!");
                if(infoValida != 1) warnings.push("Confirme que o conteúdo do ficheiro de metadados está correto!");
            
                var pdir = path.normalize(__dirname+"/..")
                let qpath = pdir + "/" + req.file.path
                try{
                    fs.unlinkSync(qpath)
                }catch(err){
                    console.log("Error at upload 1: " + err);
                }

                //Supostamente falta aqui qualquer coisa dos tipos e render de uma página com os avisos tambem
            }
        });
    }
    else {
        var pdir = path.normalize(__dirname+"/..")
        let qpath = pdir + "/" + req.file.path
        try{
            fs.unlinkSync(qpath)
        }catch(err){
            console.log("Error at upload 1: " + err);
        }

        var aviso = ["O ficheiro deverá estar em formato ZIP"]
        // Novamente render de uma pagina com os tipos e os avisos
    }
}, function(req,res){
    console.log("Entrei aqui onde devia")
    // Caso o ZIP seja válido, vem do next em cima
    var pdir = path.normalize(__dirname+"/..")
    let qpath = pdir + "/" + req.file.path
    let tname = csum.hash(metadata.titulo+metadata.dataCriacao)
    let tname1 = tname.substring(0,tname.length/2)
    let tname2 = tname.substring(tname.length/2+1,tname.length)
    console.log("T1: " + tname1)
    console.log("T2: " + tname2)

    // let npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2 + "/data"

})

/*Listar todos os recursos ou só um dos recursos*/
router.get('/', (req,res) => {
    var q = url.parse(req.url,true).query
    
    if(q.id != undefined){
        //Apresentar a página de um recurso específico
        var idRecurso = q.id
        console.log('Listar recurso com id ' + idRecurso)
        axios.get('http://localhost:3003/api/recursos/' + idRecurso)
            .then(response => {
                recurso = response.data
                console.log(recurso)
                res.render('recurso',{title: recurso.titulo, recurso: recurso});
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
    else{
        console.log("Listar recursos")
        axios.get('http://localhost:3003/api/recursos')
            .then(response => {
                recursos = response.data
                console.log(recursos)
                res.render('recursos',{title: 'Recursos', recursos: recursos});
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
});

module.exports = router;