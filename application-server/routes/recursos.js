var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');

var path = require('path');
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: 'uploads'});
const sZip = require('node-stream-zip');
const { createHash } = require('crypto');
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.cookies.token;
  console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
      console.log("Token verificado e válido")
      next()
    } 
  })
}


function existe(a,b){
    for(i=0; i<b.length;i++){
        if (b[i].includes(a)) return i;
    }
    return -1;
}

function hash(string){
    return createHash('sha256').update(string).digest('hex');
}

function sleep(time){
    return new Promise((resp) => {setTimeout(resp,time)});
}

/* ----------------------------------------------- RECURSOS ----------------------------------------- */

/*UPLOAD File */
router.post("/upload", verificaToken, upload.single('myFile') , function(req,res,next){
    manifesto = 0
    informacao = 0
    manifValido = 1
    infoValida = 1
    fileList = []
    metadata = {}
    manifInfo = {}
    warnings = []

    if(req.cookies.nivel === 'produtor' || req.cookies.nivel === 'admin')
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
                        extension = f.path.split('.')[1]
                        if(extension == 'pdf' || extension == 'xml')
                            if((index=existe(f.path,fileList))==-1){
                                manifesto = 0
                                manifValido = 0
                                console.log("Ficheiro " + f.path + " não existe!")
                            }
                    })
                    if(manifesto == 1)
                        console.log("Manifesto valido")
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
                    //metadata.idSubmissor = 
                    console.log("ZIP valido")
                    zip.close()
                    next()
                }
                else{
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
                    res.render('warnings',{warnings:warnings})
                }
            });
        }
        else {
            var pdir = path.normalize(__dirname+"/..")
            let qpath = pdir + "/" + req.file.path
            try{
                fs.unlinkSync(qpath)
            }catch(err){
                console.log("Error at upload 2: " + err);
            }

            var warning = ["O ficheiro deverá estar em formato ZIP"]
            // Novamente render de uma pagina com os tipos e os avisos
            res.render('warnings',{warnings:warning})
        }
    else
        res.render("warnings",{warnings:["Não tem nível de acesso a esta página!"]})
}, function(req,res){

    const zip = new sZip({
        file: req.file.path,
        storeEntries : true
    })

    // Caso o ZIP seja válido, vem do next em cima
    var pdir = path.normalize(__dirname+"/..")
    let qpath = pdir + "/" + req.file.path
    let tname = hash(metadata.titulo+metadata.dataCriacao)
    let tname1 = tname.substring(0,tname.length/2)
    let tname2 = tname.substring(tname.length/2+1,tname.length)
    let npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
    if(!fs.existsSync(npath)){
        metadata.path = npath
        axios.post("http://localhost:3003/api/recursos?token=" + req.cookies.token,metadata)
            .then(() => {
                fs.mkdir(npath, {recursive:true}, err => {
                    if(err) console.log("Erro a criar new path: " + err)
                    else
                    {    
                        zip.extract(null,npath, err => {
                            console.log(err ? "Error extracting: " + err : "Extracted")
                            zip.close()
                        })
                    }
                })
                res.redirect("/")
            })
            .catch(err => {
                if(err.response.status == 403){
                    let aviso = ['Não tem permissão para realizar esta ação!']
                    res.render('warnings',{warnings:aviso})
                }
                console.log("Erro a enviar para a BD: " + err)
            })
        }
        else{
            warnings.push("O conteúdo que tentou inserir já existe!")
            res.render('warnings',{warnings:warnings})
        }
    try{
        fs.unlinkSync(qpath);
    }catch(err){
        console.log("Erro a eliminar ficheiro da pasta uploads: " + err)
    }
    sleep(300)
    .then(() => {
        if(fs.existsSync(npath+"/"+req.file.originalname.split('.')[0]))
            try{
                fs.unlinkSync(npath+"/"+req.file.originalname.split('.')[0]+"/RRD-SIP.json")
                fs.unlinkSync(npath+"/"+req.file.originalname.split('.')[0]+"/metadata.json")
            }catch(err){
                console.log("Erro a remover ficheiros manifesto e metadados: " + err)
            }
    })

})

/*Listar todos os recursos ou só um dos recursos*/
router.get('/', verificaToken, (req,res) => {
    var q = url.parse(req.url,true).query
    
    if(q.id != undefined){
        //Apresentar a página de um recurso específico
        var idRecurso = q.id
        console.log('Listar recurso com id ' + idRecurso)
        axios.get('http://localhost:3003/api/recursos/' + idRecurso + "?token=" + req.cookies.token)
            .then(response => {
                recurso = response.data
                console.log(recurso)
                res.render('recurso',{title: recurso.titulo, recurso: recurso, logged:'true', nivel:req.cookies.nivel});
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
    else{
        console.log("Listar recursos")
        axios.get('http://localhost:3003/api/recursos?token=' + req.cookies.token)
            .then(response => {
                recursos = response.data
                res.render('recursos',{title: 'Recursos', recursos: recursos, logged:'true',nivel:req.cookies.nivel});
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
});

router.get("/administrar", verificaToken, (req,res,next) => {
    console.log("Página de administração de recursos")
    // res.redirect("/recursos");
    if(req.cookies.nivel === 'admin')
        axios.get('http://localhost:3003/api/recursos?token=' + req.cookies.token)
                .then(response => {
                    recursos = response.data
                    res.render('recursos_admin',{title: 'Recursos', recursos: recursos, logged:'true',nivel:req.cookies.nivel});
                })
                .catch(error => {
                    res.render('error', {error: error});
                })
    else
        res.render("warnings",{warnings:["Não tem nível de acesso a esta página!"]})
})

module.exports = router;