var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');

var path = require('path')
var fs = require('fs')
var multer = require('multer')
var upload = multer({dest: 'uploads'})
const sZip = require('node-stream-zip')



function existe(a,b){
    for(i=0; i<b.length;i++){
        if (b[i].includes(a)) return i
    }
    return -1
}

/*UPLOAD File */
router.post("/upload", upload.single('myFile') , (req,res) => {

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
                manifesto=1
                data = zip.entryDataSync(fileList[index]).toString("utf8")
                manifInfo = JSON.parse(data)

                manifInfo.data.forEach(f => {
                    if(existe(f,fileList)==-1){
                        manifesto=0
                        manifValido=0
                    }
                })
                console.log("manifesto valido")
            }

            //  Verificar se os metados existem e estão corretamente preenchidos
            if((index=existe("metadata.json",fileList))!=-1){
                informacao=1
                data = zip.entryDataSync(fileList[index]).toString("utf8")
                infoInfo = JSON.parse(data)
                if(!(infoInfo.hasOwnProperty('dataCriacao') && infoInfo.hasOwnProperty('titulo') && infoInfo.hasOwnProperty('titulo') && infoInfo.hasOwnProperty('idProdutor'))){
                    informacao = 0
                    infoValida = 0
                }
                else{
                    metadata.dataCriacao = infoInfo.dataCriacao
                    metadata.dataSubmissao = infoInfo.dataSubmissao
                    metadata.idProdutor = infoInfo.idProdutor
                    metadata.idSubmissor = infoInfo.idSubmissor
                    metadata.titulo = infoInfo.titulo
                    metadata.tipo = infoInfo.tipo
                }

                

            }

            
        });

    }else {
        console.log("Ficheiro inválido, deve ser um zip")
    }

});

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