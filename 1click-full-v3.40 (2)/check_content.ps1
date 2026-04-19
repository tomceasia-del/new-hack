$c = [System.IO.File]::ReadAllText('c:\Users\PC\CascadeProjects\1click-extension\1click.v.283\js\content.js')
Write-Output "File length: $($c.Length) chars"

# Find the Showcase products click section
$idx = $c.IndexOf('TUXTabBar')
Write-Output "TUXTabBar at char: $idx"

if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 300)
    $len = [Math]::Min(3000, $c.Length - $start)
    Write-Output "=== Showcase click section ==="
    Write-Output $c.Substring($start, $len)
}
