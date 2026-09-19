$files = Get-ChildItem -Path . -Include *.html,*.js -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules|dist' }
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    if ($null -ne $c) {
        $n = $c -replace 'Portada de Construcciones', 'portadas-construcciones' -replace 'Portadas/', 'portadas/' -replace 'Clips/', 'clips/'
        if ($c -cne $n) {
            Set-Content -Path $f.FullName -Value $n -NoNewline
        }
    }
}
