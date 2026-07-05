<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Project;

class ProjectController extends Controller
{
    private function useFallback()
    {
        try {
            \DB::connection()->getPdo();
            return false;
        } catch (\Exception $e) {
            return true;
        }
    }

    private function getFallbackProjects()
    {
        if (!Storage::exists('projects.json')) {
            Storage::put('projects.json', json_encode([]));
        }
        return json_decode(Storage::get('projects.json'), true);
    }

    private function saveFallbackProjects($projects)
    {
        Storage::put('projects.json', json_encode(array_values($projects), JSON_PRETTY_PRINT));
    }

    public function index()
    {
        if ($this->useFallback()) {
            return response()->json($this->getFallbackProjects());
        }

        return response()->json(Project::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'path' => 'required|string',
        ]);

        $path = $request->path;

        // Verify if path exists
        if (!is_dir($path)) {
            return response()->json([
                'message' => "The directory path '$path' does not exist on this machine. Please make sure it is a valid absolute path."
            ], 422);
        }

        if ($this->useFallback()) {
            $projects = $this->getFallbackProjects();
            $newProject = [
                'id' => count($projects) + 1,
                'name' => $request->name,
                'path' => $path,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];
            $projects[] = $newProject;
            $this->saveFallbackProjects($projects);
            return response()->json($newProject, 201);
        }

        $project = Project::create([
            'name' => $request->name,
            'path' => $path,
        ]);

        return response()->json($project, 201);
    }

    public function show($id)
    {
        if ($this->useFallback()) {
            $projects = $this->getFallbackProjects();
            foreach ($projects as $project) {
                if ($project['id'] == $id) {
                    return response()->json($project);
                }
            }
            return response()->json(['message' => 'Project not found'], 404);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }
        return response()->json($project);
    }

    public function destroy($id)
    {
        if ($this->useFallback()) {
            $projects = $this->getFallbackProjects();
            $filtered = array_filter($projects, function ($p) use ($id) {
                return $p['id'] != $id;
            });
            $this->saveFallbackProjects($filtered);
            return response()->json(['message' => 'Project deleted from fallback local storage']);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }
        $project->delete();
        return response()->json(['message' => 'Project deleted']);
    }
}
