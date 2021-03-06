'use strict';
var GulpConfig = (function () {
    function GulpConfig() {
        this.source = './src/';
        this.build = './build/';

        this.buildOutputPath = this.build;
        this.buildOutputPathJS = this.build + '/src';
    
        this.tsOutputPath = this.source + '/js';
        this.allJavaScript = [this.source + '/js/**/*.js'];
        this.allTypeScript = this.source + '*.ts';

        this.typings = './typings/';
        this.libraryTypeScriptDefinitions = './typings/**/*.ts';
    }
    return GulpConfig;
})();
module.exports = GulpConfig;