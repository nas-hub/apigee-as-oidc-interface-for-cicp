var prompt = require("prompt");
var colors = require("colors/safe");
var replace = require("replace-in-file");
var fs = require("fs");
var srcDir = "./";
var pattern = "IdP_Pattern_1A_OIDC";

var schema = {
    properties: {
      org: {
        description: colors.yellow("Enter the Apigee Edge Organization name"),
        message: colors.red("Apigee Edge Organization name cannot be empty!"),
        required: true
      },
      env: {
        description: colors.yellow("Enter the Apigee Edge Environment name"),
        message: colors.red("Apigee Edge Environment name cannot be empty!"),
        required: true
      },
      hostname: {
        description: colors.yellow("Enter the Hostname, this will be used for referring to JWKS Endpoint as well as .well-known configuration."),
        message: colors.red("Hostname name cannot be empty!"),
        required: true
      },
      proxy_name: {
        description: colors.yellow("Enter the Proxy name"),
        message: colors.red("Proxy name cannot be empty!"),
        required: true
      },
      
      proxy_basepath: {
        description: colors.yellow("Enter the Proxy basepath, for example '/v1/auth'"),
        message: colors.red("Proxy basepath cannot be empty!"),
        required: true
      },
      kvm_oidc_config_name: {
        description: colors.yellow("Enter the Apigee KVM to store OIDC JWKS config."),
        message: colors.red("Key Value Map name cannot be empty!"),
        required: true
      },
      jwks_key_id:{
        description: colors.yellow("Enter Key Id used to identify the public key in JWKS key list."),
        message: colors.red("Key Id cannot be empty!"),
        required: true
      },
     jwt_issuer:{
        description: colors.yellow("Enter JWT Issuer Name."),
        message: colors.red("JWT Issuer Name cannot be empty!"),
        required: true
      },    
      backend_login_endpoint:{
        description: colors.yellow("Enter the Backend Login Service endpoint with needed query params."),
        message: colors.red("Key Value Backend Login Service endpoint name cannot be empty!"),
        required: true
      },  
     api_product_name: {
        description: colors.yellow("Enter API Product name to this proxy."),
        message: colors.red("Key Value API Product name cannot be empty!"),
        required: true
      },
     api_app_name: {
        description: colors.yellow("Enter Developer Application name to this proxy."),
        message: colors.red("Key Value Developer Application name cannot be empty!"),
        required: true
      },
      username: {
        description: colors.yellow("Enter the Apigee Edge username"),
        message: colors.red("Apigee Edge username cannot be empty!"),
        required: true
      },
      password: {
        description: colors.yellow("Enter the Apigee Edge password"),
        message: colors.red("Apigee Edge password cannot be empty!"),
        hidden: true,  
        replace: '*',
        required: true
      }
    }
  };
 
//
// Start the prompt
//
prompt.start();

prompt.get(schema, async function (err, options) {
  await deleteExistingDevApp(srcDir, options);
  await deployProxyAndDependencies(srcDir, options);
});

async function deleteExistingDevApp(srcDir, options){
  const mvn = require('maven').create({
      cwd: srcDir,
      debug: false
  });
  options["apigee.config.options"]= "delete";
  options["apigee.config.file"]= "./target/edge.json";
  await mvn.execute(['clean','process-resources','apigee-config:apps'], options);
  console.log("Cleaning complete !");
}

async function deployProxyAndDependencies(srcDir, options) {
  const mvn = require('maven').create({
    cwd: srcDir,
    profiles: ["deploy"],
    debug: false
  });
  options["apigee.config.options"]= "update";
  options["apigee.config.file"]= "./target/edge.json";
  await mvn.execute(['clean', 'install'], options);
    var apps = require('./target/devAppKeys.json');
    var edge = require('./target/edge.json');

    var prodName = edge.orgConfig.apiProducts[0].name;
    var developer = edge.orgConfig.developers[0].email;
    var appName = edge.orgConfig.developerApps[developer][0].name;

    var clientId;
    apps.forEach(function(app) {
      if(app.name === appName){
        var credentials = app.credentials;
        credentials.forEach(function(credential){
          var apiProducts = credential.apiProducts;
          apiProducts.forEach(function(apiProduct){
            if(apiProduct.apiproduct === prodName)
              clientId = credential.consumerKey;
          })
        });
      }
    });
  console.log('Client Id: '+ clientId);
  console.log("Successfully configured!");
}

