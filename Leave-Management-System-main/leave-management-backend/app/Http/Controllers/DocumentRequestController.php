<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'reason'      => 'nullable|string|max:500',
        ]);

        $user = auth()->user();

        $id = DB::table('document_requests')->insertGetId([
            'user_id'     => $user->id,
            'document_id' => $data['document_id'],
            'reason'      => $data['reason'] ?? null,
            'status'      => 'pending',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $hr = DB::table('users')->where('role', 'hr')->first();
        if ($hr) {
            $document = DB::table('documents')->where('id', $data['document_id'])->value('name');
            DB::table('notifications')->insert([
                'user_id'             => $hr->id,
                'document_request_id' => $id,
                'type'                => 'leave_submitted', // reuse as generic "submitted"
                'message'             => "{$user->name} requested a document: {$document}.",
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }

        return response()->json(['message' => 'Document request submitted.'], 201);
    }

    public function myRequests()
    {
        $requests = DB::table('document_requests')
            ->join('documents', 'document_requests.document_id', '=', 'documents.id')
            ->where('document_requests.user_id', auth()->id())
            ->orderByDesc('document_requests.created_at')
            ->select(
                'document_requests.id',
                'documents.name as document',
                'document_requests.reason',
                'document_requests.status',
                'document_requests.rejection_reason',
                'document_requests.created_at',
            )
            ->get();

        return response()->json(['requests' => $requests]);
    }

    // HR only
    public function pending()
    {
        $pending = DB::table('document_requests')
            ->join('users', 'document_requests.user_id', '=', 'users.id')
            ->join('documents', 'document_requests.document_id', '=', 'documents.id')
            ->where('document_requests.status', 'pending')
            ->orderBy('document_requests.created_at')
            ->select(
                'document_requests.id',
                'users.name as employee_name',
                'documents.name as document',
                'document_requests.reason',
                'document_requests.created_at',
            )
            ->get();

        return response()->json(['pending' => $pending]);
    }

    public function approve($id)
    {
        $req = DB::table('document_requests')->where('id', $id)->first();
        if (!$req || $req->status !== 'pending') {
            return response()->json(['error' => 'Request not found or already processed.'], 422);
        }

        DB::table('document_requests')->where('id', $id)->update([
            'status'     => 'approved',
            'updated_at' => now(),
        ]);

        DB::table('notifications')->insert([
            'user_id'             => $req->user_id,
            'document_request_id' => $id,
            'type'                => 'document_approved',
            'message'             => 'Your document request has been approved. You can pick it up in person.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        return response()->json(['message' => 'Document request approved.']);
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['rejection_reason' => 'required|string|max:500']);

        $req = DB::table('document_requests')->where('id', $id)->first();
        if (!$req || $req->status !== 'pending') {
            return response()->json(['error' => 'Request not found or already processed.'], 422);
        }

        DB::table('document_requests')->where('id', $id)->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'updated_at'       => now(),
        ]);

        DB::table('notifications')->insert([
            'user_id'             => $req->user_id,
            'document_request_id' => $id,
            'type'                => 'document_rejected',
            'message'             => 'Your document request has been rejected.',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        return response()->json(['message' => 'Document request rejected.']);
    }
}
