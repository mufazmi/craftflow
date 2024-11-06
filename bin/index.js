#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pluralize = require('pluralize');
const changeCase = require('case');

// Utility function to create a file with content
const createFile = (fileName, content) => {
    fs.writeFileSync(fileName, content);
    console.log(`Created file: ${fileName}`);
};

const loadTemplateWithReplacements = (templatePath, moduleName) => {
    const content = fs.readFileSync(templatePath, 'utf8');
    const className = changeCase.pascal(moduleName); // Task
    const varName = changeCase.camel(moduleName);    // task

    return content
        .replace(/Base/g, className) // e.g., "Base" -> "Task"
        .replace(/base/g, varName);  // e.g., "base" -> "task"
};

// Generate folder structure and template-based index.ts files for each submodule
const generateFiles = (moduleName) => {
    const moduleBasePath = path.join(process.cwd(), 'src', 'packages', moduleName);
    const folders = {
        'controllers': 'base-controller.ts',
        'dtos': 'base-dto.ts',
        'models': 'base-model.ts',
        'routes': 'base-route.ts',
        'services': 'base-service.ts',
        'validations': 'base-validation.ts'
    };

    if (fs.existsSync(moduleBasePath)) {
        console.error(`Module "${moduleName}" already exists at ${moduleBasePath}.`);
        process.exit(1);
    }

    Object.entries(folders).forEach(([folder, templateFile]) => {
        const folderPath = path.join(moduleBasePath, folder);
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Created folder: ${folderPath}`);

        // Adjust the path to locate the templates folder correctly
        const templatePath = path.resolve(__dirname, '../templates', templateFile);
        const content = loadTemplateWithReplacements(templatePath, moduleName);

        const indexFilePath = path.join(folderPath, 'index.ts');
        createFile(indexFilePath, content);
    });

    console.log(`Module "${moduleName}" created successfully in src/packages/${moduleName}`);
};

// Initialize project folders, files, and configurations
const initProject = () => {
    const srcFolderPath = path.join(process.cwd(), 'src');

    if (fs.existsSync(srcFolderPath)) {
        console.error('Project already initialized. "src" folder already exists.');
        process.exit(1);
    }

    // Initialize folders based on templates and configurations
    Object.values(templates.folders).forEach(folder => {
        const folderPath = path.join(process.cwd(), 'src', folder);
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Created folder: ${folderPath}`);
    });

    // Generate initial files from templates
    templates.initialFiles.concat(templates.initialAuthFiles).forEach(template => {
        const dest = path.join('src', template);
        const templatePath = path.join(__dirname, '..', 'templates', template);
        const destPath = path.join(process.cwd(), dest);
        const content = fs.readFileSync(templatePath, 'utf8');

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        createFile(destPath, content);
    });

    createEnvFiles();
    updatePackageJson();
    installDependencies();
};

// Create .env and .env.prod files
const createEnvFiles = () => {
    const envContent = Object.entries(envConfig.env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    createFile(path.join(process.cwd(), '.env'), envContent);
    createFile(path.join(process.cwd(), '.env.prod'), envContent);
};

// Update package.json with required scripts and dependencies
const updatePackageJson = () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
        ...packageJson.scripts,
        ...dependencies.scripts
    };

    packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...dependencies.devDependencies
    };

    packageJson.dependencies = {
        ...packageJson.dependencies,
        ...dependencies.dependencies
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json with required scripts and dependencies.');
};

// Install npm dependencies
const installDependencies = () => {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Installed dependencies.');
};

// Display help information for available commands
const displayHelp = () => {
    console.log(`
Usage: craftflow <command>

Commands:
  init                          Initialize a new project
  create <module-name>          Create a new module with controllers, services, and routes in src/packages/<module-name>
  help                          Display help information
`);
};

// Main function to handle CLI commands
const main = () => {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('No command provided.');
        process.exit(1);
    }

    const command = args[0];

    switch (command) {
        case 'init':
            initProject();
            break;
        case 'create':
            if (args.length < 2) {
                console.error('No module name provided.');
                process.exit(1);
            }
            const moduleName = args[1];
            generateFiles(moduleName);
            break;
        case 'help':
            displayHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            displayHelp();
            process.exit(1);
    }
};

main();
