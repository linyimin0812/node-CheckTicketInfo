"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 根据API注释，生成基于swagger规范的文档
 */
const path = require("path");
const swaggerJsDoc = require("swagger-jsdoc");
const fs = require("fs");
class SwaggerFile {
    static generateFile() {
        let swaggerDefinition = {
            info: {
                title: 'Node Swagger API',
                version: '1.0.0',
                description: '火车余票通知系统',
            },
            host: process.env.HOST + ":" + process.env.PORT,
            basePath: '/'
        };
        let options = {
            // import swaggerDefinitions
            swaggerDefinition: swaggerDefinition,
            // path to the API docs
            apis: [path.join(__dirname, "./*.js")]
        };
        let swaggerSpec = swaggerJsDoc(options);
        fs.writeFileSync(path.join(__dirname, "../public/swagger.json"), JSON.stringify(swaggerSpec));
    }
}
exports.SwaggerFile = SwaggerFile;
//# sourceMappingURL=SwaggerFile.js.map