<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ProjectAnalyzerController extends Controller
{
    private function getProjectInfo($path)
    {
        if ($this->useFallback()) {
            $projects = json_decode(\Storage::get('projects.json') ?? '[]', true);
            foreach ($projects as $p) {
                if ($p['id'] == $path || $p['path'] == $path) {
                    return $p;
                }
            }
        } else {
            $project = \App\Models\Project::find($path);
            if ($project) {
                return $project->toArray();
            }
        }
        
        // If path is absolute itself
        if (is_dir($path)) {
            return ['path' => $path, 'name' => basename($path)];
        }

        return null;
    }

    private function useFallback()
    {
        try {
            \DB::connection()->getPdo();
            return false;
        } catch (\Exception $e) {
            return true;
        }
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'project_id' => 'required',
        ]);

        $project = $this->getProjectInfo($request->project_id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $path = $project['path'];

        if (!is_dir($path)) {
            return response()->json(['message' => 'Project path does not exist'], 422);
        }

        // 1. Detect Stack
        $stack = [];
        if (file_exists($path . '/composer.json')) {
            $stack[] = 'Laravel/PHP';
        }
        if (file_exists($path . '/package.json')) {
            $packageJson = json_decode(file_get_contents($path . '/package.json'), true);
            if (isset($packageJson['dependencies']['react']) || isset($packageJson['devDependencies']['react'])) {
                $stack[] = 'React';
            } elseif (isset($packageJson['dependencies']['vue']) || isset($packageJson['devDependencies']['vue'])) {
                $stack[] = 'Vue';
            } else {
                $stack[] = 'Node.js';
            }
        }
        if (empty($stack)) {
            $stack[] = 'Unknown Stack';
        }

        // 2. Scan Directory Structure (limited depth and excluding heavy vendor folders)
        $fileTree = $this->scanDirectory($path);

        // 3. Scan Laravel Specifics (if present)
        $routes = [];
        $controllers = [];
        $models = [];
        $middlewares = [];

        if (in_array('Laravel/PHP', $stack)) {
            // Scan routes
            $routesPath = $path . '/routes';
            if (is_dir($routesPath)) {
                foreach (File::files($routesPath) as $file) {
                    $routes[] = [
                        'name' => $file->getFilename(),
                        'path' => str_replace('\\', '/', $file->getRealPath())
                    ];
                }
            }

            // Scan controllers
            $controllersPath = $path . '/app/Http/Controllers';
            if (is_dir($controllersPath)) {
                $controllers = $this->findFilesRecursive($controllersPath, 'Controller.php');
            }

            // Scan models
            $modelsPath = $path . '/app/Models';
            if (is_dir($modelsPath)) {
                $models = $this->findFilesRecursive($modelsPath, '.php');
            } else {
                // Older Laravel structure
                $appPath = $path . '/app';
                if (is_dir($appPath)) {
                    $models = $this->findFilesRecursive($appPath, '.php', false); // non-recursive for app root
                }
            }

            // Scan Middleware
            $middlewarePath = $path . '/app/Http/Middleware';
            if (is_dir($middlewarePath)) {
                $middlewares = $this->findFilesRecursive($middlewarePath, '.php');
            }
        }

        return response()->json([
            'project_name' => $project['name'],
            'project_path' => $path,
            'stack' => $stack,
            'file_tree' => $fileTree,
            'routes' => $routes,
            'controllers' => $controllers,
            'models' => $models,
            'middlewares' => $middlewares,
        ]);
    }

    private function scanDirectory($dir, $depth = 0, $maxDepth = 3)
    {
        if ($depth > $maxDepth) {
            return [];
        }

        $result = [];
        if (!is_dir($dir)) {
            return $result;
        }

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || $file === 'node_modules' || $file === 'vendor' || $file === '.git') {
                continue;
            }

            $filePath = $dir . DIRECTORY_SEPARATOR . $file;
            $isDir = is_dir($filePath);

            $item = [
                'name' => $file,
                'type' => $isDir ? 'directory' : 'file',
                'relative_path' => $file,
            ];

            if ($isDir) {
                $children = $this->scanDirectory($filePath, $depth + 1, $maxDepth);
                if (!empty($children)) {
                    $item['children'] = $children;
                }
            }

            $result[] = $item;
        }

        return $result;
    }

    private function findFilesRecursive($dir, $suffix, $recursive = true)
    {
        $result = [];
        if (!is_dir($dir)) {
            return $result;
        }

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                if ($recursive) {
                    $result = array_merge($result, $this->findFilesRecursive($filePath, $suffix, $recursive));
                }
            } else {
                if (str_ends_with($file, $suffix)) {
                    $result[] = [
                        'name' => $file,
                        'relative_path' => str_replace('\\', '/', $file),
                        'absolute_path' => str_replace('\\', '/', $filePath)
                    ];
                }
            }
        }

        return $result;
    }

    public function getFileContent(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->path;

        if (!file_exists($path) || is_dir($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->json([
            'path' => $path,
            'content' => file_get_contents($path)
        ]);
    }
}
