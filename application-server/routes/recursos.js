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
const AdmZip = require('adm-zip');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.cookies.token;
//   console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
    //   console.log("Token verificado e válido")
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
                        hashed_path = hash(f.path)
                        if(hashed_path == f.checksum)
                            if(extension == 'pdf' || extension == 'xml')
                                if((index=existe(f.path,fileList))==-1){
                                    manifesto = 0
                                    manifValido = 0
                                    console.log("Ficheiro " + f.path + " não existe!")
                                    warnings.push("Ficheiro " + f.path + " não existe!")
                                }
                            else
                                warnings.push("Só são aceites ficheiros em PDF ou XML!")
                        else
                            warnings.push("O checksum apresentado não corresponde valor certo de acordo com o path!")
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
                        var tipos =['tese','enunciado','artigo','slides','relatorio'] 
                        if (!(tipos.includes(infoInfo.tipo))) {
                            informacao = 0
                            warnings.push("Tipo de recurso não aceite!")
                        }
                        else metadata.tipo = infoInfo.tipo

                        console.log("Metadados válidos")
                    }
                }
                else{
                    informacao = 0
                }

                if(manifesto==1 && informacao==1){
                    // Para já fica o que está nos metadados mas posteriormente adicionamos
                    // a data em que fizer efetivamente upload e 
                    // metadata.dataSubmissao = infoInfo.dataSubmissao
                    var decoded = jwt.decode(req.cookies.token,{complete:true})
                    var username = decoded.payload.username
                    metadata.dataSubmissao = new Date().toISOString().substring(0,16).split('T').join(' ')
                    metadata.idSubmissor = username
                    console.log('Sumissor: ' + username)
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
        metadata.path = "/public/fileStorage/" + tname1 + "/" + tname2
        axios.post("http://localhost:8003/api/recursos?token=" + req.cookies.token,metadata)
            .then(dados => {
                var idRecurso = dados.data._id
                fs.mkdir(npath, {recursive:true}, err => {
                    if(err) console.log("Erro a criar new path: " + err)
                    else
                    {   
                        zip.extract(null,npath, err => {
                            console.log(err ? "Error extracting: " + err : "Extracted")
                            if (!err) {
                                //Adicionar às notícias
                                var decoded = jwt.decode(req.cookies.token,{complete:true})
                                var username = decoded.payload.username 
                                //console.log('metadados para fazer a noticia: ', metadata)
                                var noticia = {
                                    nome: username,
                                    acao: 'submeteu um recurso',
                                    data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                                    idRecurso: idRecurso,
                                    visivel: true
                                }
                                axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                                    .then(resposta => {
                                        // console.log(resposta)
                                        var log = {}
                                        log.user = username;
                                        log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                                        log.movimento = "efetuou o upload de " + metadata.titulo
                                        axios.post("http://localhost:8004/logs",log)
                                          .then(dados => console.log("Log adicionado"))
                                          .catch(err => {console.log("Erro ao enviar log: " + err)})
                                        zip.close()
                                        res.redirect("/")
                                    })
                                    .catch(err => {
                                        console.log("Erro ao enviar noticia para a BD: " + err)
                                        res.render('error',{error:err})
                                    })
                            }
                        })
                    }
                })
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
        // console.log('Listar recurso com id ' + idRecurso)
        axios.get('http://localhost:8003/api/recursos/' + idRecurso + "?token=" + req.cookies.token)
            .then(response => {
                recurso = response.data
                // console.log(recurso)
                var decoded = jwt.decode(req.cookies.token,{complete:true})

                var ficheirosObj = []
                var pdir = path.normalize(__dirname+"/..")
                let qpath = pdir + "/" + recurso.path
                let tname = hash(recurso.titulo+recurso.dataCriacao)
                let tname1 = tname.substring(0,tname.length/2)
                let tname2 = tname.substring(tname.length/2+1,tname.length)
                let npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
                var caminho = pdir+recurso.path
                if(caminho == npath){
                    var ficheiros = getFiles(caminho,ficheiros);
                    console.log(ficheiros)
                    ficheiros.forEach(f => {
                        var fSplit = f.split('/')
                        var size = fSplit.length 
                        var nomeFicheiro = fSplit[size-1]
                        ficheirosObj.push({filePath: f, nome: nomeFicheiro})
                    })
                }

                var log = {}
                log.user = decoded.payload.username;
                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                log.movimento = "acedeu a página do recurso " + recurso.titulo
                axios.post("http://localhost:8004/logs",log)
                    .then(dados => console.log("Log adicionado"))
                    .catch(err => {console.log("Erro ao enviar log: " + err)})
                axios.get("http://localhost:8003/comentarios/" + idRecurso + "?token=" + req.cookies.token)
                    .then(data => {
                        if(data.data!=undefined) comentarios = data.data
                        else comentarios = []
                        console.log(ficheirosObj)
                        res.render('recurso',{title: recurso.titulo,user:decoded.payload.username, comentarios:comentarios ,recurso: recurso, logged:'true', nivel:req.cookies.nivel, ficheiros: ficheirosObj});
                    })
                    .catch(err => {
                        console.log("Erro ao apresentar recurso: " + err);
                        res.render('error',{error:err})
                    })
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
    else{
        // console.log("Listar recursos")
        axios.get('http://localhost:8003/api/recursos?token=' + req.cookies.token)
            .then(response => {
                recursos = response.data
                res.render('recursos',{title: 'Recursos', recursos: recursos, logged:'true',nivel:req.cookies.nivel});
            })
            .catch(error => {
                res.render('error', {error: error});
            })
    }
});

/* Visualizar um documento no browser (pdf ou xml) */
router.get('/consultaOnline', verificaToken, (req, res, next) => {
    var q = url.parse(req.url,true).query
    if (q.path != undefined){
        res.sendFile(q.path, (err) => {
            if(err)
                res.render('warnings', {warnings: ['O formato do ficheiro não é suportado pelo Browser!']})
        })
    } else 
        res.render('warnings', {warnings: ['Falta indicar o id do recurso na query']})
})

router.get("/administrar", verificaToken, (req,res,next) => {
    var q = url.parse(req.url,true).query
    // console.log(q.tipo)
    if(req.cookies.nivel === 'admin')
        if(q.tipo!=undefined){
            axios.get("http://localhost:8003/api/recursos?tipo=" + q.tipo + "&token=" + req.cookies.token)
                .then(data => {
                    res.render('recursos_admin',{title:'Recursos', recursos:data.data,logged:'true',nivel:req.cookies.nivel})
                })
                .catch(erro => {
                    console.log("Erro ao admiistrar tipo" + q.tipo + ": " + erro)
                })
        }
        else{
            // console.log("entrei aqui")
            axios.get('http://localhost:8003/api/recursos?token=' + req.cookies.token)
                    .then(response => {
                        recursos = response.data
                        res.render('recursos_admin',{title: 'Recursos', recursos: recursos, logged:'true',nivel:req.cookies.nivel});
                    })
                    .catch(error => {
                        res.render('error', {error: error});
                    })
        }
    else
        res.render("warnings",{warnings:["Não tem nível de acesso a esta página!"]})
})

router.get('/search', (req,res,next)=> {
    var q = url.parse(req.url,true).query
    if (q.search!=''){
        axios.get("http://localhost:8003/api/recursos?search=" + q.search + "&token=" + req.cookies.token)
            .then(data => {
                var decoded = jwt.decode(req.cookies.token,{complete:true})
                var log = {}
                log.user = decoded.payload.username;
                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                log.movimento = "pesquisou por " + "'" + q.search + "'"
                axios.post("http://localhost:8004/logs",log)
                  .then(dados => console.log("Log adicionado"))
                  .catch(err => {console.log("Erro ao enviar log: " + err)})
                res.render('recursos',{recursos:data.data,logged:'true',nivel:req.cookies.nivel})
            })
            .catch(erro => {
                console.log("Erro a pesquisar por regexp: " + erro)
                res.render('error', {error:erro})
            })
    }
    else{
        res.redirect('/')
    }
});

router.get("/tipo", (req,res,next) =>{
    var q = url.parse(req.url,true).query
    if(q.tipo!=''){
        axios.get("http://localhost:8003/api/recursos?tipo="+q.tipo+"&token="+req.cookies.token)
            .then(data => {
                var decoded = jwt.decode(req.cookies.token,{complete:true})
                var log = {}
                log.user = decoded.payload.username;
                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                log.movimento = "pesquisou pelo tipo " + q.tipo
                axios.post("http://localhost:8004/logs",log)
                  .then(dados => console.log("Log adicionado"))
                  .catch(err => {console.log("Erro ao enviar log: " + err)})
                res.render('recursos',{recursos:data.data,logged:'true',nivel:req.cookies.nivel})
            })
            .catch(erro => {
                console.log("Erro a pesquisar por tipo: " + erro)
                res.render('error',{error:erro})
            })
    }
    else{
        res.redirect('/')
    }
});

router.get("/atualizarLikes/:rid",(req,res,next)=>{
    var q = url.parse(req.url,true).query
    if(q.tipo!=undefined){
        // console.log(q.tipo)
        axios.put("http://localhost:8003/api/recursos/" + req.params.rid + "/atualizarLikes?tipo="+q.tipo+"&token="+req.cookies.token)
            .then(dados=>{
                // console.log("Likes atualizado")
                var log = {}
                var decoded = jwt.decode(req.cookies.token,{complete:true})
                log.user = decoded.payload.username;
                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                log.movimento = (q.tipo=='inc' ? "deu like" : "deu dislike") + " no recurso " + dados.data.titulo
                axios.post("http://localhost:8004/logs",log)
                  .then(dados => console.log("Log adicionado"))
                  .catch(err => {console.log("Erro ao enviar log: " + err)})
                var noticia = {
                    nome: decoded.payload.username,
                    acao: 'gostou de um recurso',
                    data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                    idRecurso: req.params.rid,
                    visivel: true
                }
                axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                    .then(() => console.log('Notícia nova adicionada (like de recurso)'))
                    .catch(err => res.render('error', {error: err}))
                res.redirect("/recursos?id="+req.params.rid)
            })
            .catch(err => {
                console.log("Erro ao atualizar likes: " + err);
                res.render('error',{error:err});
            })
    }else{
        console.log("Erro ao atualizar Likes")
        res.redirect(res.get('referer'))
    }
})

router.get('/eliminar/:id', (req,res,next) => {
    var id = req.params.id
    if (id != undefined) {
        // console.log(id)
        //Remover do fileStorage
        //É preciso um get dos metadados deste recurso
        axios.get("http://localhost:8003/api/recursos/" + id + "?token=" + req.cookies.token)
            .then(resposta => {
                // console.log(resposta)
                var metadata = resposta.data 
                var caminho = metadata.path
                var fullpath = path.normalize(__dirname+"/..") + caminho
                // console.log(fullpath.split('/'))
                var pasta_a_eliminar = ""
                var caminho_split = fullpath.split("/")
                for(i=0; i<caminho_split.length-1;i++)
                    pasta_a_eliminar += caminho_split[i] + "/"
                console.log(pasta_a_eliminar)
                if(fs.existsSync(pasta_a_eliminar)){
                    fs.rmdirSync(pasta_a_eliminar, {recursive:true});
                    // console.log("Pasta eliminada com sucesso");
                }else{
                    console.log("Pasta a eliminar não existente")
                }
                axios.delete('http://localhost:8003/api/recursos/' + id + '?token=' + req.cookies.token)
                    .then(resposta => {
                        // console.log('Recurso eliminado com sucesso')
                        //console.log(metadata)
                        //var path = metadata.path 
                        // console.log(path)
                        var decoded = jwt.decode(req.cookies.token,{complete:true})
                        var log = {}
                        log.user = decoded.payload.username;
                        log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                        log.movimento = "removeu o recurso " + resposta.data.titulo
                        axios.post("http://localhost:8004/logs",log)
                          .then(dados => console.log("Log adicionado"))
                          .catch(err => {console.log("Erro ao enviar log: " + err)})
                        var noticia = {
                            nome: decoded.payload.username,
                            acao: 'eliminou um recurso',
                            data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                            idRecurso: req.params.id,
                            visivel: true
                        }
                        axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                            .then(() => console.log('Notícia nova adicionada (remoção de recurso)'))
                            .catch(err => res.render('error', {error: err}))
                        if (req.cookies.nivel == 'admin')
                            res.redirect('/recursos/administrar')
                        else
                            res.redirect('/users/perfil')
                    })
                    .catch(error => {
                        console.log('Erro ao eliminar recurso: ' + error)
                        res.render('error', {error: error})
                    })
            })
            .catch(error => {
                console.log('Erro ao fazer get do recurso ' + id + ': ' + error)
                res.render('error', {error: error});
            })
    }
});

router.get('/editar/:rid', (req,res,next) => {
    var id = req.params.rid
    if (id != undefined) {
        console.log(id)
        axios.get('http://localhost:8003/api/recursos/' + id + '?token=' + req.cookies.token)
            .then(dados => {
                // console.log(dados)
                var tipo = dados.data.tipo
                var titulo = dados.data.titulo
                res.render('editar_recurso',{title: 'Edição do recurso ' + titulo + ' (' + tipo + ')', recurso: dados.data,logged:'true',nivel:req.cookies.nivel})
            })
            .catch(error => {
                console.log('Erro ao consultar o recurso com o id ' + id)
                res.render('error',{error: error});
            })
    }
})

router.post('/editar/:rid', verificaToken, (req,res,next) => {
    var recursoAtualizado = req.body
    // console.log(recursoAtualizado)
    axios.put('http://localhost:8003/api/recursos/' + req.params.rid + '?token=' + req.cookies.token, recursoAtualizado)
        .then(resposta => {
            // console.log(resposta)
            var decoded = jwt.decode(req.cookies.token,{complete:true})
            var log = {}
            log.user = decoded.payload.username;
            log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
            log.movimento = "editou o recurso " + recursoAtualizado.titulo
            axios.post("http://localhost:8004/logs",log)
              .then(dados => console.log("Log adicionado"))
              .catch(err => {console.log("Erro ao enviar log: " + err)})
            //Adicionar uma nova notícia
            var noticia = {
                nome: decoded.payload.username,
                acao: 'editou um recurso',
                data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                idRecurso: req.params.rid,
                visivel: true
            }
            axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                .then(() => console.log('Notícia nova adicionada (edição de recurso)'))
                .catch(err => res.render('error', {error: err}))
            if (req.cookies.nivel == 'admin')
                res.redirect('/recursos/administrar')
            else
                res.redirect('/users/perfil')
        })
        .catch(error => {
            console.log('Erro ao editar: ' + error)
            res.render('error', {error: error})
        })
})

function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            // files_.push(name)
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}


router.get("/download/:rid", (req,res,next) => {
    axios.get("http://localhost:8003/api/recursos/"+req.params.rid+"?token="+req.cookies.token)
        .then(data => {
            var recurso = data.data
            // Metadados
            var metadata = {}
            metadata.dataCriacao = recurso.dataCriacao
            metadata.dataSubmissao = recurso.dataSubmissao
            metadata.tipo = recurso.tipo
            metadata.idProdutor = recurso.idProdutor
            metadata.idSubmissor = recurso.idSubmissor
            metadata.titulo = recurso.titulo
            // RRD
            var rrd = {}
            rrd.version = "1.0"
            rrd.encoding = "UTF-8"
            rrd.algorithm = "sha256"
            rrd.data = []
            
            // Fazer pasta temporária de download, calcular o hash a partir daí
            var pdir = path.normalize(__dirname+"/..")
            var caminho = pdir+recurso.path
            var tname = hash(metadata.titulo+metadata.dataCriacao)
            let tname1 = tname.substring(0,tname.length/2)
            let tname2 = tname.substring(tname.length/2+1,tname.length)
            var npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
            var temppath = pdir + "/public/fileStorage/temporario"
            // console.log("Caminho na BD: " + caminho)
            // console.log("Caminho calculado:" + npath)
            var files = []
            if(npath == caminho){
                files = getFiles(caminho,files);
                files.forEach(f=>{
                    console.log(f)
                    let caminho_file = f.split(tname2)[1]
                    let caminhos_split = caminho_file.split('/')
                    let checksum_info = {}
                    let caminho_checksum = ""
                    for(i=2;i<caminhos_split.length;i++){
                        if (i==2) caminho_checksum += caminhos_split[i]
                        else caminho_checksum += "/" + caminhos_split[i]
                    }
                    checksum_info.checksum = hash(caminho_checksum)
                    checksum_info.path = caminho_checksum
                    rrd.data.push(checksum_info)
                })
                // No fim de ter a pasta temporária criada tenho de criar o ficheiro de metadados com a metadata
                // e criar o manifesto RRD-SIP com os checksums calculados a partir da pasta data
                let metadata_json_info = JSON.stringify(metadata,null,4)
                //Para cada ficheiro dentro da pasta data, calcular o checksum e guardar no json RRD-SIP
                let manifest_json_info = JSON.stringify(rrd,null,4)
                let caminho_completo = files[0].split(tname2)[1].split("data")[0]
                console.log(caminho_completo)
                let json_split = caminho_completo.split('/')
                // console.log(json_split)
                let caminho_json = ""
                for(i=1;i<json_split.length-1;i++) caminho_json += "/" + json_split[i] 
                // console.log("Caminho para guardar o json: " + temppath+caminho_json)
                // Depois tenho de fazer o zip disto tudo
                caminho_json = temppath+caminho_json
                console.log(caminho_json)
                if(!fs.existsSync(caminho_json)){
                    fs.mkdir(caminho_json, {recursive:true}, err => {
                        if(err) console.log("Erro ao criar pasta temporaria: " + err) 
                        else{
                            fs.writeFile(caminho_json+"/RRD-SIP.json",manifest_json_info, err =>{if(err) console.log(err)})
                            fs.writeFile(caminho_json+"/metadata.json",metadata_json_info, err =>{if(err) console.log(err)})
                        }
                    })
                }else{
                    console.log("Caminho temporário para escrita dos ficheiros JSON ainda não existe")
                }
                sleep(300)
                .then(() => {
                    try {
                        const zipper = new AdmZip();
                        var outputFile = caminho_json+".zip";
                        zipper.addLocalFolder(npath+caminho_completo);
                        zipper.addLocalFile(caminho_json+"/RRD-SIP.json");
                        zipper.addLocalFile(caminho_json+"/metadata.json");
                        zipper.writeZip(outputFile);
                        console.log(`Created ${outputFile} successfully`);
                    } catch (e) {
                        console.log(`Something went wrong. ${e}`);
                    }
                })
            //     // console.log("Cheguei aqui")
                sleep(500)
                .then(() => {
                    res.download(caminho_json+".zip", err=> {
                        if (err){
                            console.log("Erro ao descarregar ficheiro: " +  err)
                            // res.redirect("/")
                        }else{
                            if(fs.existsSync(temppath)){
                                fs.rmSync(temppath, {recursive:true});
                            }else{
                                console.log("Pasta a eliminar não existente")
                            }
                            console.log("Download bem sucedido")
                            var decoded = jwt.decode(req.cookies.token,{complete:true})
                            var log = {}
                            log.user = decoded.payload.username;
                            log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                            log.movimento = "descarregou o recurso " + files[0].split(tname2)[1].split('/')[files[0].split(tname2)[1].split('/').length-1]
                            axios.post("http://localhost:8004/logs",log)
                            .then(dados => console.log("Log adicionado"))
                            .catch(err => {console.log("Erro ao enviar log: " + err)})
                            // console.log("Entrei aqui")
                        }
                    })
                })
            }
                // res.redirect("/")
            })
        .catch(erro => {
            console.log("Erro ao descarregar ficheiro: " + erro);
            res.render('error',{error:erro})
        })
});

 /* --------------------------------------- Comentarios --------------------------------------- */
router.post("/comentar/:rid", verificaToken,(req,res,next) => {
    var q = url.parse(req.url,true).query
    // console.log(q)
    if(q.user!=undefined){
        comentario = {
            user: q.user,
            texto: req.body.textarea,
            idRecurso: req.params.rid
        }
        axios.post("http://localhost:8003/comentarios?token="+req.cookies.token,comentario)
            .then(data => {
                console.log("Comentario adicionado")
                axios.get("http://localhost:8003/api/recursos/"+req.params.rid+"?token="+req.cookies.token)
                    .then(dados => {
                        //Criar notícia e log para o comentário
                        var decoded = jwt.decode(req.cookies.token,{complete:true})
                        var noticia = {
                            nome: decoded.payload.username,
                            acao: 'comentou um recurso',
                            data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                            idRecurso: req.params.rid,
                            visivel: true
                        }
                        axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                            .then(resposta => {
                                // console.log(resposta)
                                var log = {}
                                log.user = decoded.payload.username;
                                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                                log.movimento = "adicionou um comentário ao recurso " + dados.data.titulo
                                axios.post("http://localhost:8004/logs",log)
                                    .then(dados => console.log("Log adicionado"))
                                    .catch(err => {console.log("Erro ao enviar log: " + err)})
                            })
                            .catch(err => {
                                console.log("Erro ao enviar noticia para a BD: " + err)
                                res.render('error',{error:err})
                            })
                        res.redirect("/recursos?id="+req.params.rid)
                    })
                    .catch(err =>{
                        console.log("Erro ao obter recurso: " + err)
                    })
            })
            .catch(err => {
                console.log("Erro ao inserir comentario: " + err)
            })
    }else{
        console.log("Erro ao comentar, utilizador não identificado!")
    }
})

router.get("/comentarios/eliminar/:rid", verificaToken,(req,res,next) => {
    var q = url.parse(req.url,true).query
    if(q.user!=undefined)
        axios.delete("http://localhost:8003/comentarios/"+req.params.rid+"?token="+req.cookies.token+"&user="+q.user)
            .then(resp => {
                axios.get("http://localhost:8003/api/recursos/"+resp.data.idRecurso+"?token="+req.cookies.token)
                    .then(dados => {
                        console.log(dados)
                        var decoded = jwt.decode(req.cookies.token,{complete:true})
                        var noticia = {
                            nome: decoded.payload.username,
                            acao: 'eliminou um comentário',
                            data: new Date().toISOString().slice(0, 16).split('T').join(' '),
                            idRecurso: req.params.rid,
                            visivel: true
                        }
                        axios.post('http://localhost:8003/noticias?token=' + req.cookies.token, noticia)
                            .then(resposta => {
                                var log = {}
                                log.user = decoded.payload.username;
                                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                                log.movimento = "eliminou um comentário do recurso " + dados.data.titulo
                                axios.post("http://localhost:8004/logs",log)
                                    .then(dados => console.log("Log adicionado"))
                                    .catch(err => {console.log("Erro ao enviar log: " + err)})
                                res.redirect("/recursos?id="+resp.data.idRecurso)
                            })
                            .catch(err => {
                                console.log("Erro ao enviar noticia para a BD: " + err)
                                res.render('error',{error:err})
                            })
                    })
                    .catch(err =>{
                        console.log("Erro ao obter recurso: " + err)
                    })
            })
            .catch(err => {
                console.log("Erro ao eliminar comentario")
                res.render('error',{error:err})
            })
    else{
        console.log("Não pode efetuar esta ação")
        res.render('warnings',{warnings:["Não tem permissão para realizar esta ação!"]})
    }
})

module.exports = router;