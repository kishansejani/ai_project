<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CodeGeneratorController extends Controller
{
    private function getProjectInfo($path)
    {
        try {
            \DB::connection()->getPdo();
            $project = \App\Models\Project::find($path);
            if ($project) {
                return $project->toArray();
            }
        } catch (\Exception $e) {
            $projects = json_decode(\Storage::get('projects.json') ?? '[]', true);
            foreach ($projects as $p) {
                if ($p['id'] == $path || $p['path'] == $path) {
                    return $p;
                }
            }
        }
        
        if (is_dir($path)) {
            return ['path' => $path, 'name' => basename($path)];
        }

        return null;
    }

    public function generateCrud(Request $request)
    {
        $request->validate([
            'project_id' => 'required',
            'model_name' => 'required|string', // e.g. "Product"
            'fields' => 'required|array', // e.g. [["name" => "title", "type" => "string"], ...]
        ]);

        $project = $this->getProjectInfo($request->project_id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $projectPath = $project['path'];
        if (!is_dir($projectPath)) {
            return response()->json(['message' => 'Project path does not exist'], 422);
        }

        $modelName = ucfirst(Str::camel($request->model_name));
        $pluralModel = Str::plural($modelName);
        $tableName = Str::snake($pluralModel);
        $fields = $request->fields;

        // 1. Generate Migration File
        $migrationContent = $this->buildMigration($tableName, $fields);
        $migrationFilename = date('Y_m_d_His') . '_create_' . $tableName . '_table.php';
        $migrationFilePath = $projectPath . '/database/migrations/' . $migrationFilename;
        $this->ensureDirectoryExists(dirname($migrationFilePath));
        file_put_contents($migrationFilePath, $migrationContent);

        // 2. Generate Model File
        $modelContent = $this->buildModel($modelName, $tableName, $fields);
        $modelFilePath = $projectPath . '/app/Models/' . $modelName . '.php';
        $this->ensureDirectoryExists(dirname($modelFilePath));
        file_put_contents($modelFilePath, $modelContent);

        // 3. Generate Controller File (API Controller)
        $controllerName = $modelName . 'Controller';
        $controllerContent = $this->buildController($modelName, $controllerName, $fields);
        $controllerFilePath = $projectPath . '/app/Http/Controllers/Api/' . $controllerName . '.php';
        $this->ensureDirectoryExists(dirname($controllerFilePath));
        file_put_contents($controllerFilePath, $controllerContent);

        // 4. Register Route in routes/api.php
        $routePath = $projectPath . '/routes/api.php';
        $routeAdded = false;
        if (file_exists($routePath)) {
            $routeContent = file_get_contents($routePath);
            $routeImport = "use App\Http\Controllers\Api\\{$controllerName};";
            $routeRegister = "Route::apiResource('" . Str::kebab($pluralModel) . "', {$controllerName}::class);";

            // Add namespace import if not present
            if (!str_contains($routeContent, $routeImport)) {
                $routeContent = preg_replace('/(<\?php[\s\S]*?use [\s\S]*?;)/', "$1\n{$routeImport}", $routeContent, 1);
            }
            // Append route
            $routeContent .= "\n{$routeRegister}\n";
            file_put_contents($routePath, $routeContent);
            $routeAdded = true;
        }

        return response()->json([
            'message' => 'CRUD components generated successfully!',
            'files' => [
                'migration' => [
                    'path' => str_replace('\\', '/', $migrationFilePath),
                    'content' => $migrationContent,
                ],
                'model' => [
                    'path' => str_replace('\\', '/', $modelFilePath),
                    'content' => $modelContent,
                ],
                'controller' => [
                    'path' => str_replace('\\', '/', $controllerFilePath),
                    'content' => $controllerContent,
                ],
            ],
            'route_added' => $routeAdded,
        ]);
    }

    private function ensureDirectoryExists($path)
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }

    private function buildMigration($tableName, $fields)
    {
        $fieldsStr = "";
        foreach ($fields as $field) {
            $name = $field['name'];
            $type = $field['type'] ?? 'string';
            $nullable = !empty($field['nullable']) ? '->nullable()' : '';
            
            $fieldsStr .= "            \$table->{$type}('{$name}'){$nullable};\n";
        }

        return "<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('{$tableName}', function (Blueprint \$table) {
            \$table->id();
{$fieldsStr}            \$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('{$tableName}');
    }
};
";
    }

    private function buildModel($modelName, $tableName, $fields)
    {
        $fillable = [];
        foreach ($fields as $field) {
            $fillable[] = "'{$field['name']}'";
        }
        $fillableStr = implode(', ', $fillable);

        return "<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class {$modelName} extends Model
{
    use HasFactory;

    protected \$table = '{$tableName}';

    protected \$fillable = [{$fillableStr}];
}
";
    }

    private function buildController($modelName, $controllerName, $fields)
    {
        $variableName = lcfirst($modelName);
        $rules = [];
        foreach ($fields as $field) {
            $rules[] = "            '{$field['name']}' => 'required'";
        }
        $rulesStr = implode(",\n", $rules);

        return "<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\\{$modelName};
use Illuminate\Http\Request;

class {$controllerName} extends Controller
{
    public function index()
    {
        return response()->json({$modelName}::all());
    }

    public function store(Request \$request)
    {
        \$validated = \$request->validate([
{$rulesStr}
        ]);

        \${$variableName} = {$modelName}::create(\$validated);

        return response()->json(\${$variableName}, 201);
    }

    public function show(\$id)
    {
        \${$variableName} = {$modelName}::find(\$id);

        if (!\${$variableName}) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(\${$variableName});
    }

    public function update(Request \$request, \$id)
    {
        \${$variableName} = {$modelName}::find(\$id);

        if (!\${$variableName}) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        \$validated = \$request->validate([
{$rulesStr}
        ]);

        \${$variableName}->update(\$validated);

        return response()->json(\${$variableName});
    }

    public function destroy(\$id)
    {
        \${$variableName} = {$modelName}::find(\$id);

        if (!\${$variableName}) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        \${$variableName}->delete();

        return response()->json(['message' => 'Record deleted successfully']);
    }
}
";
    }
}
