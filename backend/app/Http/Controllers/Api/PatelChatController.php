<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;

class PatelChatController extends Controller
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

    private function getFallbackMessages($conversationId)
    {
        $filename = "chat_{$conversationId}.json";
        if (!Storage::exists($filename)) {
            Storage::put($filename, json_encode([]));
        }
        return json_decode(Storage::get($filename), true);
    }

    private function saveFallbackMessages($conversationId, $messages)
    {
        Storage::put("chat_{$conversationId}.json", json_encode(array_values($messages), JSON_PRETTY_PRINT));
    }

    private function getFallbackConversations()
    {
        if (!Storage::exists('conversations.json')) {
            Storage::put('conversations.json', json_encode([]));
        }
        return json_decode(Storage::get('conversations.json'), true);
    }

    private function saveFallbackConversations($conversations)
    {
        Storage::put('conversations.json', json_encode(array_values($conversations), JSON_PRETTY_PRINT));
    }

    public function getConversations(Request $request)
    {
        $projectId = $request->query('project_id');

        if ($this->useFallback()) {
            $conversations = $this->getFallbackConversations();
            if ($projectId) {
                $conversations = array_filter($conversations, function ($c) use ($projectId) {
                    return $c['project_id'] == $projectId;
                });
            }
            return response()->json(array_values($conversations));
        }

        $query = Conversation::query();
        if ($projectId) {
            $query->where('project_id', $projectId);
        }
        return response()->json($query->latest()->get());
    }

    public function createConversation(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'project_id' => 'required',
        ]);

        if ($this->useFallback()) {
            $conversations = $this->getFallbackConversations();
            $newConv = [
                'id' => count($conversations) + 1,
                'title' => $request->title,
                'project_id' => $request->project_id,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];
            $conversations[] = $newConv;
            $this->saveFallbackConversations($conversations);
            return response()->json($newConv, 201);
        }

        $conv = Conversation::create([
            'title' => $request->title,
            'project_id' => $request->project_id,
        ]);
        return response()->json($conv, 201);
    }

    public function getMessages($conversationId)
    {
        if ($this->useFallback()) {
            return response()->json($this->getFallbackMessages($conversationId));
        }

        $messages = Message::where('conversation_id', $conversationId)->orderBy('created_at', 'asc')->get();
        return response()->json($messages);
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'required',
            'project_context' => 'nullable|array', // Contains routes, controllers, models, stack info
            'current_file' => 'nullable|array', // Contains path and content
        ]);

        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            return response()->json([
                'sender' => 'patel',
                'content' => "👋 **Kem cho!** I am **Patel**, your AI assistant for Developer OS.\n\nTo start chatting with me, please add your free Gemini API key to your backend `.env` file:\n\n```env\nGEMINI_API_KEY=your_actual_api_key_here\n```\n\n> 💡 **Don't have a key?** You can get a **100% Free Gemini API key** from [Google AI Studio](https://aistudio.google.com/) in less than a minute. Let me know once you add it!"
            ]);
        }

        $userMessage = $request->message;
        $conversationId = $request->conversation_id;
        $projectContext = $request->project_context;
        $currentFile = $request->current_file;

        // Load chat history
        $chatHistory = [];
        if ($this->useFallback()) {
            $chatHistory = $this->getFallbackMessages($conversationId);
        } else {
            $chatHistory = Message::where('conversation_id', $conversationId)
                ->orderBy('created_at', 'asc')
                ->get()
                ->toArray();
        }

        // Format history for Gemini API
        $contents = [];
        
        $systemPrompt = <<<EOD
You are 'Patel', a developer assistant for Developer OS. Your job is to help users manage, analyze, and build features in their software projects.
You explain controllers, models, routes, and migrations.
When the user asks for database sequence diagrams or user flows, generate beautiful Mermaid diagram code blocks (using ```mermaid).
Keep your answers professional, direct, clear, and optimize for 0-cost, lightweight web structures.

ADDITIONAL AGENT CAPABILITIES:
You can directly implement code changes and run commands on the user's project!
If the user asks you to implement a feature, add fields, write code, run migrations, or install packages, you MUST include a JSON block enclosed in <execute_actions> and </execute_actions> tags.
The JSON must be an array of objects, where each object represents an action to perform:
- To write/create/modify a file:
  {
    "action": "write_file",
    "path": "relative/path/to/file.php",
    "content": "full code content of the file"
  }
- To run an artisan or composer/npm command:
  {
    "action": "run_command",
    "command": "php artisan migrate" (or any other command like 'php artisan make:model', 'composer require', etc.)
  }

For example:
Let's add a status field to the products table.
<execute_actions>
[
  {
    "action": "write_file",
    "path": "database/migrations/2026_07_05_000000_add_status_to_products_table.php",
    "content": "..."
  },
  {
    "action": "run_command",
    "command": "php artisan migrate"
  }
]
</execute_actions>

Always output the code files fully. Do not use place holders. Always keep paths relative to the project root.
EOD;

        if (!empty($projectContext)) {
            $systemPrompt .= "\n\nHere is the scanned context of the user's current project:";
            $systemPrompt .= "\n- Tech Stack: " . implode(', ', $projectContext['stack'] ?? []);
            $systemPrompt .= "\n- Registered Path: " . ($projectContext['project_path'] ?? 'Unknown');
            
            if (!empty($projectContext['routes'])) {
                $systemPrompt .= "\n- Detected Routes: " . json_encode(array_column($projectContext['routes'], 'name'));
            }
            if (!empty($projectContext['controllers'])) {
                $systemPrompt .= "\n- Detected Controllers: " . json_encode(array_column($projectContext['controllers'], 'name'));
            }
            if (!empty($projectContext['models'])) {
                $systemPrompt .= "\n- Detected Models: " . json_encode(array_column($projectContext['models'], 'name'));
            }
        }

        if (!empty($currentFile)) {
            $systemPrompt .= "\n\nThe user is currently looking at this file: " . ($currentFile['path'] ?? 'Unknown');
            $systemPrompt .= "\nFile Content:\n```\n" . ($currentFile['content'] ?? '') . "\n```";
        }

        // Map previous messages
        foreach ($chatHistory as $msg) {
            $role = ($msg['sender'] === 'user') ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $msg['content']]]
            ];
        }

        // Add current message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]]
        ];

        // Save User Message
        $savedUserMsg = [
            'id' => count($chatHistory) + 1,
            'conversation_id' => $conversationId,
            'sender' => 'user',
            'content' => $userMessage,
            'created_at' => now()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
        ];
        if ($this->useFallback()) {
            $chatHistory[] = $savedUserMsg;
            $this->saveFallbackMessages($conversationId, $chatHistory);
        } else {
            Message::create([
                'conversation_id' => $conversationId,
                'sender' => 'user',
                'content' => $userMessage,
            ]);
        }

        // Call Gemini API
        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'contents' => $contents,
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]]
                ]
            ]);

            if ($response->failed()) {
                $errorMessage = "Sorry, I encountered an error communicating with Gemini API: " . ($response->json()['error']['message'] ?? $response->body());
                $aiResponse = [
                    'sender' => 'patel',
                    'content' => $errorMessage
                ];
            } else {
                $candidates = $response->json('candidates');
                $responseText = $candidates[0]['content']['parts'][0]['text'] ?? "I received an empty response. Please try again.";
                
                // Parse and execute actions if present in $responseText
                $executedLogs = [];
                if (preg_match('/<execute_actions>(.*?)<\/execute_actions>/s', $responseText, $matches)) {
                    $jsonContent = trim($matches[1]);
                    // Strip markdown block formatting if present
                    if (str_starts_with($jsonContent, '```json')) {
                        $jsonContent = preg_replace('/^```json|```$/', '', $jsonContent);
                        $jsonContent = trim($jsonContent);
                    } else if (str_starts_with($jsonContent, '```')) {
                        $jsonContent = preg_replace('/^```|```$/', '', $jsonContent);
                        $jsonContent = trim($jsonContent);
                    }
                    
                    $actions = json_decode($jsonContent, true);
                    if (is_array($actions)) {
                        // Find project path
                        $projectPath = null;
                        if (!$this->useFallback()) {
                            $conversation = Conversation::find($conversationId);
                            if ($conversation) {
                                $project = Project::find($conversation->project_id);
                                if ($project) {
                                    $projectPath = $project->path;
                                }
                            }
                        } else {
                            if (!empty($projectContext) && !empty($projectContext['project_path'])) {
                                $projectPath = $projectContext['project_path'];
                            }
                        }

                        if ($projectPath && is_dir($projectPath)) {
                            foreach ($actions as $action) {
                                if (isset($action['action'])) {
                                    if ($action['action'] === 'write_file' && isset($action['path']) && isset($action['content'])) {
                                        $filePath = rtrim($projectPath, '/\\') . '/' . ltrim($action['path'], '/\\');
                                        $dir = dirname($filePath);
                                        if (!is_dir($dir)) {
                                            mkdir($dir, 0755, true);
                                        }
                                        file_put_contents($filePath, $action['content']);
                                        $executedLogs[] = "✅ Written file: `{$action['path']}`";
                                    } elseif ($action['action'] === 'run_command' && isset($action['command'])) {
                                        // Run the command in the project directory using shell_exec
                                        $cmd = 'cd /d ' . escapeshellarg($projectPath) . ' && ' . $action['command'] . ' 2>&1';
                                        $output = shell_exec($cmd);
                                        $executedLogs[] = "💻 Executed command: `{$action['command']}`\n\n```\n" . trim($output) . "\n```";
                                    }
                                }
                            }
                        } else {
                            $executedLogs[] = "⚠️ Could not execute actions: Project path not found or invalid.";
                        }
                    } else {
                        $executedLogs[] = "⚠️ Could not parse actions: Invalid JSON format.";
                    }
                }

                if (!empty($executedLogs)) {
                    $responseText .= "\n\n### ⚙️ Patel Agent Actions Executed:\n" . implode("\n", $executedLogs);
                }
                
                // Save Patel Response
                $savedPatelMsg = [
                    'id' => count($chatHistory) + 1,
                    'conversation_id' => $conversationId,
                    'sender' => 'patel',
                    'content' => $responseText,
                    'created_at' => now()->toDateTimeString(),
                    'updated_at' => now()->toDateTimeString(),
                ];
                if ($this->useFallback()) {
                    $chatHistory[] = $savedPatelMsg;
                    $this->saveFallbackMessages($conversationId, $chatHistory);
                } else {
                    Message::create([
                        'conversation_id' => $conversationId,
                        'sender' => 'patel',
                        'content' => $responseText,
                    ]);
                }

                $aiResponse = [
                    'sender' => 'patel',
                    'content' => $responseText
                ];
            }
        } catch (\Exception $e) {
            $aiResponse = [
                'sender' => 'patel',
                'content' => "Exception calling Gemini API: " . $e->getMessage() . ". Please check your internet connection."
            ];
        }

        return response()->json($aiResponse);
    }
}
