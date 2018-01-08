
/**
 * 根据API注释，生成基于swagger规范的文档
 */
import * as path from "path";
import * as swaggerJsDoc from "swagger-jsdoc";
import * as fs from "fs";
class SwaggerFile{
    public static generateFile(): void{
        let swaggerDefinition: {[key: string]: any} = {
            info: {
                title: 'Node Swagger API',
                version: '1.0.0',
                description: '火车余票通知系统',
            },
            host: process.env.HOST + ":" + process.env.PORT,
            basePath: '/'
        };
        let options: {} = {
            // import swaggerDefinitions
            swaggerDefinition: swaggerDefinition,
            // path to the API docs
            apis: [path.join(__dirname, "./*.js")]
        }

        let swaggerSpec = swaggerJsDoc(options);
        fs.writeFileSync(path.join(__dirname, "../public/swagger.json"), JSON.stringify(swaggerSpec));
    }
}
export{SwaggerFile};